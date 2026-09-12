import { readFileSync, writeFileSync } from 'node:fs'
import { projectUS } from '../src/data/usMapProjection.ts'

// Source: https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json
if (!process.argv[2])
  throw new Error(
    'Usage: node scripts/build-landing-map.mjs path/to/states-10m.json',
  )
const topology = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const { scale, translate } = topology.transform
const arcs = topology.arcs.map((arc) => {
  let x = 0
  let y = 0
  return arc.map((point) => {
    x += point[0]
    y += point[1]
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
  })
})
const states = topology.objects.states.geometries
  .filter((geometry) => Number(geometry.id) <= 56)
  .map((geometry) => {
    const polygons =
      geometry.type === 'Polygon' ? [geometry.arcs] : geometry.arcs
    const d = polygons
      .flatMap((polygon) =>
        polygon.map((ring) => {
          const points = ring
            .flatMap((id) => (id < 0 ? [...arcs[~id]].reverse() : arcs[id]))
            .map(([longitude, latitude]) => projectUS(longitude, latitude))
            .filter(Boolean)
          return points.length > 2
            ? `M${points.map((point) => point.map((value) => value.toFixed(1)).join(',')).join('L')}Z`
            : ''
        }),
      )
      .join('')
    return { id: geometry.id, name: geometry.properties.name, d }
  })
writeFileSync(
  new URL('../src/data/usMapPaths.json', import.meta.url),
  JSON.stringify(states, null, 2) + '\n',
)
console.log(`Generated ${states.length} state/DC map paths`)
