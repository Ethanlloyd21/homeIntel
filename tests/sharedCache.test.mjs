import assert from 'node:assert/strict'
import test from 'node:test'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import {
  loadPlaces,
  readCache,
  responseCacheKey,
  writeCache,
} from '../amplify/functions/api/sharedCache.ts'

test('shared cache ignores expired TTL records and skips oversized responses', async () => {
  const originalSend = DynamoDBDocumentClient.prototype.send
  const calls = []
  try {
    DynamoDBDocumentClient.prototype.send = async (command) => {
      calls.push(command)
      return {
        Item: { expiresAt: Math.floor(Date.now() / 1000) - 1, value: 'stale' },
      }
    }
    assert.equal(await readCache('expired'), undefined)
    await writeCache('large', 'x'.repeat(350_001), 120)
    assert.equal(calls.length, 1)
    await writeCache('small', { result: 'ok' }, 120)
    assert.equal(calls[1].input.Item.value.result, 'ok')
    assert.ok(calls[1].input.Item.expiresAt > Date.now() / 1000)
    assert.ok(
      !responseCacheKey('/api/place-search', 'q=private-address').includes(
        'private-address',
      ),
    )
  } finally {
    DynamoDBDocumentClient.prototype.send = originalSend
  }
})

test('address searches reuse shared cached results without fetching upstream', async () => {
  const originalSend = DynamoDBDocumentClient.prototype.send
  const originalFetch = globalThis.fetch
  const results = [{ lat: '41', lon: '-87', display_name: 'A place' }]
  try {
    DynamoDBDocumentClient.prototype.send = async () => ({
      Item: { expiresAt: Math.floor(Date.now() / 1000) + 60, value: results },
    })
    globalThis.fetch = () => {
      throw new Error('Unexpected upstream request')
    }
    assert.deepEqual(
      await loadPlaces(new URLSearchParams({ q: 'A place' })),
      results,
    )
  } finally {
    DynamoDBDocumentClient.prototype.send = originalSend
    globalThis.fetch = originalFetch
  }
})

test('a held distributed address-search lease prevents a second upstream request', async () => {
  const originalSend = DynamoDBDocumentClient.prototype.send
  const originalFetch = globalThis.fetch
  let calls = 0
  let fetched = false
  try {
    DynamoDBDocumentClient.prototype.send = async (command) => {
      calls++
      if (calls === 1) return {}
      assert.equal(command.input.Item.id, 'nominatim-lock')
      assert.ok(
        command.input.ConditionExpression.includes('attribute_not_exists'),
      )
      const error = new Error('Already leased')
      error.name = 'ConditionalCheckFailedException'
      throw error
    }
    globalThis.fetch = () => {
      fetched = true
      throw new Error('Unexpected upstream request')
    }
    await assert.rejects(
      loadPlaces(new URLSearchParams({ q: 'A place' })),
      /busy/,
    )
    assert.equal(fetched, false)
  } finally {
    DynamoDBDocumentClient.prototype.send = originalSend
    globalThis.fetch = originalFetch
  }
})
