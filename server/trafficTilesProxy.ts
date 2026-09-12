import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { typicalTrafficInstant } from '../src/utils/trafficTiming.ts'

export const trafficTilesProxy = (
  apiKey: string,
  historicalKey = '',
): Plugin => {
  const cache = new Map<string, { bytes: Uint8Array; expires: number }>()
  const summaries = new Map<string, { body: string; expires: number }>()
  const handle = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (url.pathname === '/api/traffic-status') {
      response.setHeader('Content-Type', 'application/json')
      response.end(
        JSON.stringify({
          configured: Boolean(apiKey),
          typicalConfigured: Boolean(historicalKey),
        }),
      )
      return
    }
    if (url.pathname === '/api/traffic-summary') {
      response.setHeader('Content-Type', 'application/json')
      const lat = Number(url.searchParams.get('lat')),
        lon = Number(url.searchParams.get('lon'))
      if (
        !url.searchParams.has('lat') ||
        !url.searchParams.has('lon') ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      ) {
        response.statusCode = 400
        response.end(
          JSON.stringify({ error: 'Valid city coordinates are required.' }),
        )
        return
      }
      if (!apiKey) {
        response.statusCode = 503
        response.end(
          JSON.stringify({ error: 'Live traffic is not connected.' }),
        )
        return
      }
      const key = `${lat.toFixed(4)},${lon.toFixed(4)}`
      const cached = summaries.get(key)
      if (cached && cached.expires > Date.now()) {
        response.end(cached.body)
        return
      }
      const samples: {
        speed: number
        freeFlowSpeed: number
        delayPercent: number
        closed: boolean
        confidence: number
        point: string
      }[] = []
      for (const [dy, dx] of [
        [0, 0],
        [0.025, 0],
        [-0.025, 0],
        [0, 0.025],
        [0, -0.025],
      ]) {
        try {
          const upstream = new URL(
            'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json',
          )
          upstream.searchParams.set('key', apiKey)
          upstream.searchParams.set('point', `${lat + dy},${lon + dx}`)
          upstream.searchParams.set('unit', 'MPH')
          const r = await fetch(upstream, {
            signal: AbortSignal.timeout(10000),
          })
          if (!r.ok) continue
          const d = (await r.json()).flowSegmentData
          if (
            !d ||
            !Number.isFinite(d.currentSpeed) ||
            !Number.isFinite(d.freeFlowSpeed) ||
            !Number.isFinite(d.currentTravelTime) ||
            !(d.freeFlowTravelTime > 0)
          )
            continue
          const point = JSON.stringify(
            d.coordinates?.coordinate ?? [lat + dy, lon + dx],
          )
          if (samples.some((s) => s.point === point)) continue
          samples.push({
            speed: d.currentSpeed,
            freeFlowSpeed: d.freeFlowSpeed,
            delayPercent: Math.max(
              0,
              (d.currentTravelTime / d.freeFlowTravelTime - 1) * 100,
            ),
            closed: Boolean(d.roadClosure),
            confidence: d.confidence ?? 0,
            point,
          })
        } catch {
          /* Partial coverage is reported by the sample count. */
        }
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
      if (!samples.length) {
        response.statusCode = 502
        response.end(
          JSON.stringify({ error: 'No live road samples were returned.' }),
        )
        return
      }
      const body = JSON.stringify({
        sampleCount: samples.length,
        delayPercent:
          samples.reduce((sum, s) => sum + s.delayPercent, 0) / samples.length,
        closedRoads: samples.filter((s) => s.closed).length,
        updatedAt: new Date().toISOString(),
        scope: 'Nearby road samples, not a citywide average',
      })
      if (summaries.size >= 64) summaries.delete(summaries.keys().next().value!)
      summaries.set(key, { body, expires: Date.now() + 120000 })
      response.end(body)
      return
    }
    if (!url.pathname.startsWith('/api/traffic-tiles/')) return next()
    const match = /^\/api\/traffic-tiles\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(
      url.pathname,
    )
    const [zoom, x, y] = match ? match.slice(1).map(Number) : [-1, -1, -1]
    if (
      !match ||
      zoom < 0 ||
      zoom > 22 ||
      x < 0 ||
      y < 0 ||
      x >= 2 ** zoom ||
      y >= 2 ** zoom
    ) {
      response.statusCode = 400
      response.end('Invalid traffic tile.')
      return
    }
    const typical = url.searchParams.get('mode') === 'typical'
    let instant: number | null = null
    if (typical) {
      try {
        const day = url.searchParams.get('day') ?? ''
        if (!/^[0-6]$/.test(day)) throw new Error('Invalid day')
        instant = typicalTrafficInstant(
          Number(day),
          url.searchParams.get('time') ?? '',
          url.searchParams.get('timeZone') ?? '',
        )
      } catch {
        response.statusCode = 400
        response.end('Invalid day, time, or time zone.')
        return
      }
    }
    if (typical ? !historicalKey : !apiKey) {
      response.statusCode = 503
      response.end(
        typical
          ? 'Historical traffic is not connected.'
          : 'Traffic data is not configured.',
      )
      return
    }
    try {
      const tileKey = `${url.pathname}|${typical ? instant : 'live'}`
      let tile = cache.get(tileKey)
      if (!tile || tile.expires <= Date.now()) {
        const upstream = new URL(
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative/${zoom}/${x}/${y}.png`,
        )
        upstream.searchParams.set('key', apiKey)
        upstream.searchParams.set('thickness', '5')
        const historical = new URL(
          'https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer/export',
        )
        if (typical) {
          const extent = 20037508.342789244,
            span = (extent * 2) / 2 ** zoom
          Object.entries({
            bbox: `${-extent + x * span},${extent - (y + 1) * span},${-extent + (x + 1) * span},${extent - y * span}`,
            bboxSR: '3857',
            imageSR: '3857',
            size: '256,256',
            transparent: 'true',
            format: 'png32',
            layers: 'show:7',
            time: String(instant),
            f: 'image',
            token: historicalKey,
          }).forEach(([key, value]) => historical.searchParams.set(key, value))
        }
        const result = await fetch(typical ? historical : upstream, {
          signal: AbortSignal.timeout(15_000),
        })
        if (
          !result.ok ||
          !result.headers.get('content-type')?.includes('image/png')
        )
          throw new Error('Traffic tile unavailable')
        tile = {
          bytes: new Uint8Array(await result.arrayBuffer()),
          expires: Date.now() + 120_000,
        }
        if (cache.size >= 256) cache.delete(cache.keys().next().value!)
        cache.set(tileKey, tile)
      }
      response.setHeader('Content-Type', 'image/png')
      response.setHeader(
        'Cache-Control',
        `private, max-age=${Math.max(0, Math.floor((tile.expires - Date.now()) / 1000))}`,
      )
      response.end(tile.bytes)
    } catch {
      response.statusCode = 502
      response.setHeader('Cache-Control', 'no-store')
      response.end('Traffic layer is temporarily unavailable.')
    }
  }
  return {
    name: 'homeintel-traffic-tiles',
    configureServer: (server) => {
      server.middlewares.use(handle)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handle)
    },
  }
}
