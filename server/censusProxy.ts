import { upstreamFetch } from './upstreamFetch.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

export const censusProxy = (apiKey: string): Plugin => {
  const handle = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const url = new URL(request.url || '/', 'http://localhost')
    if (!url.pathname.startsWith('/api/census/')) return next()
    response.setHeader('Content-Type', 'application/json')
    const dataset = url.pathname.slice('/api/census/'.length)
    // Only datasets consumed by this app; never accept arbitrary upstream URLs.
    if (
      !/^(20\d{2}\/acs\/acs5(?:\/profile)?|2019\/pep\/population)$/.test(
        dataset,
      )
    ) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Unsupported Census dataset.' }))
      return
    }
    if (!apiKey) {
      response.statusCode = 503
      response.end(
        JSON.stringify({ error: 'Census API key is not configured.' }),
      )
      return
    }
    const params = new URLSearchParams()
    for (const [key, value] of url.searchParams) {
      if (!['get', 'for', 'in', 'DATE_CODE'].includes(key)) continue
      params.append(key, value)
    }
    params.set('key', apiKey)
    try {
      const upstream = await upstreamFetch(
        `https://api.census.gov/data/${dataset}?${params}`,
        {
          signal: AbortSignal.timeout(10_000),
        },
      )
      if (!upstream.ok) throw new Error('Census unavailable')
      const data: unknown = await upstream.json()
      response.setHeader('Cache-Control', 'private, max-age=21600')
      response.end(JSON.stringify(data))
    } catch {
      response.statusCode = 502
      response.end(JSON.stringify({ error: 'Census data is unavailable.' }))
    }
  }
  return {
    name: 'homeintel-census-proxy',
    configureServer: (server) => {
      server.middlewares.use(handle)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(handle)
    },
  }
}
