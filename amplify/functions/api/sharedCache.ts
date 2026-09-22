import { createHash } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import type { PlaceSearchLoader } from '../../../server/apiPlugins.ts'

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    maxAttempts: 1,
    requestHandler: { connectionTimeout: 1000, requestTimeout: 2000 },
  }),
)
const tableName = process.env.CACHE_TABLE_NAME
const hash = (value: string) => createHash('sha256').update(value).digest('hex')

export const readCache = async <T>(id: string): Promise<T | undefined> => {
  const result = await client.send(
    new GetCommand({ TableName: tableName, Key: { id }, ConsistentRead: true }),
  )
  if (result.Item && result.Item.expiresAt > Date.now() / 1000)
    return result.Item.value as T
  return undefined
}

export const writeCache = async (id: string, value: unknown, ttl: number) => {
  // DynamoDB's item limit is 400 KB; leave space for keys and metadata.
  if (Buffer.byteLength(JSON.stringify(value)) > 350_000) return
  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: { id, value, expiresAt: Math.floor(Date.now() / 1000) + ttl },
    }),
  )
}

export const responseCacheKey = (path: string, query: string) =>
  `response:${hash(`${path}?${query}`)}`

/** A shared lease prevents parallel Lambda instances from overloading Nominatim. */
export const loadPlaces: PlaceSearchLoader = async (params) => {
  const id = `places:${hash(params.toString())}`
  const cached = await readCache<Awaited<ReturnType<PlaceSearchLoader>>>(id)
  if (cached) return cached
  const owner = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  try {
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: { id: 'nominatim-lock', owner, expiresAt: now + 20 },
        ConditionExpression: 'attribute_not_exists(id) OR expiresAt < :now',
        ExpressionAttributeValues: { ':now': now },
      }),
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'ConditionalCheckFailedException'
    ) {
      throw new Error('Address search is busy. Please retry.', { cause: error })
    }
    throw error
  }
  try {
    const result = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'ReloIntel/0.1 (relocation research tool)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!result.ok) throw new Error('Address search unavailable')
    const value = (await result.json()) as Awaited<
      ReturnType<PlaceSearchLoader>
    >
    await writeCache(id, value, 7 * 24 * 60 * 60)
    return value
  } finally {
    // Wait inside the invocation; Lambda may freeze unawaited timers on return.
    await new Promise((resolve) => setTimeout(resolve, 1100))
    await client.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id: 'nominatim-lock' },
        ConditionExpression: '#owner = :owner',
        ExpressionAttributeNames: { '#owner': 'owner' },
        ExpressionAttributeValues: { ':owner': owner },
      }),
    )
  }
}
