import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { URL } from 'node:url'
import test from 'node:test'
import { projectUS } from '../src/data/usMapProjection.ts'

const states = JSON.parse(
  readFileSync(new URL('../src/data/usMapPaths.json', import.meta.url), 'utf8'),
)
const insideRing = ([x, y], ring) => {
  let inside = false
  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index++
  ) {
    const [xi, yi] = ring[index]
    const [xj, yj] = ring[previous]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

test('atlas includes every state and DC, with finite paths inside the viewport', () => {
  assert.equal(states.length, 51)
  assert.equal(new Set(states.map((state) => state.id)).size, 51)
  for (const state of states) {
    const points = [...state.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)]
    assert.ok(points.length > 2, state.name)
    for (const [, x, y] of points) {
      assert.ok(
        Number(x) >= 0 && Number(x) <= 980,
        `${state.name} x outside viewport`,
      )
      assert.ok(
        Number(y) >= 0 && Number(y) <= 615,
        `${state.name} y outside viewport`,
      )
    }
  }
})

test('city pins land in their own states, including Alaska and Hawaii insets', () => {
  const cities = [
    ['California', -122.4194, 37.7749],
    ['Texas', -97.7431, 30.2672],
    ['Illinois', -87.65, 41.85],
    ['North Carolina', -78.6386, 35.7721],
    ['Washington', -122.3321, 47.6062],
    ['Colorado', -104.9903, 39.7392],
    ['Alaska', -149.9, 61.2],
    ['Hawaii', -157.86, 21.3],
  ]
  for (const [name, longitude, latitude] of cities) {
    const point = projectUS(longitude, latitude)
    assert.ok(point, name)
    const state = states.find((item) => item.name === name)
    const rings = [...state.d.matchAll(/M([^Z]+)Z/g)].map(([, ring]) =>
      [...ring.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) => [
        Number(x),
        Number(y),
      ]),
    )
    assert.ok(
      rings.some((ring) => insideRing(point, ring)),
      `${name} pin is outside its map shape`,
    )
  }
})

test('atlas declines unsupported or invalid coordinates instead of inventing a pin', () => {
  assert.equal(projectUS(2.35, 48.86), null)
  assert.equal(projectUS(-66.1, 18.4), null)
  assert.equal(projectUS(NaN, 40), null)
  assert.equal(projectUS(-100, Infinity), null)
})
