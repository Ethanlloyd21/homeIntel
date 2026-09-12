import assert from 'node:assert/strict'
import test from 'node:test'
import { placeSearchParams } from '../src/utils/placeSearch.ts'

test('a street-only home search includes the selected city and state', () => {
  const params = placeSearchParams(
    '123 Main Street',
    '41.85,-87.65',
    'Chicago',
    'Illinois',
  )
  assert.equal(params.get('q'), '123 Main Street, Chicago, Illinois')
  assert.equal(params.get('bounded'), '1')
  assert.equal(params.get('countrycodes'), 'us')
  const [west, north, east, south] = params
    .get('viewbox')
    .split(',')
    .map(Number)
  assert.ok(west < -87.65 && east > -87.65 && north > 41.85 && south < 41.85)
})

test('a fully qualified address does not repeat the locality', () => {
  assert.equal(
    placeSearchParams(
      ' 123 Main Street, chicago, Illinois ',
      '41.85,-87.65',
      'Chicago',
      'Illinois',
    ).get('q'),
    '123 Main Street, chicago, Illinois',
  )
})

test('same street in different selected cities produces different requests', () => {
  assert.notEqual(
    placeSearchParams(
      '123 Main Street',
      '41,-87',
      'Chicago',
      'Illinois',
    ).toString(),
    placeSearchParams(
      '123 Main Street',
      '30,-97',
      'Austin',
      'Texas',
    ).toString(),
  )
})

test('workplace search keeps explicit suburban addresses and a soft city bias', () => {
  const params = placeSearchParams(
    '123 Main Street, Evanston, Illinois',
    '41.85,-87.65',
  )
  assert.equal(params.get('q'), '123 Main Street, Evanston, Illinois')
  assert.equal(params.get('bounded'), '0')
})

test('invalid coordinates are never sent as a viewbox', () => {
  for (const near of ['', ',', 'NaN,-87', '91,0', '0,181', '41']) {
    assert.equal(
      placeSearchParams('123 Main Street', near, 'Chicago', 'Illinois').has(
        'viewbox',
      ),
      false,
    )
  }
})
