import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const statePattern = /^[A-Z]{2}$/

function fbiCrimeProxy(apiKey: string): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/fbi-crime') return next()

    const state = requestUrl.searchParams.get('state')?.toUpperCase() ?? ''
    response.setHeader('Content-Type', 'application/json')
    if (!statePattern.test(state)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'A valid state is required.' }))
      return
    }
    if (!apiKey) {
      response.statusCode = 503
      response.end(
        JSON.stringify({ error: 'Data.gov API key is not configured.' }),
      )
      return
    }

    const upstream = new URL(
      `https://cde.ucr.cjis.gov/LATEST/summarized/state/${state}/violent-crime`,
    )
    upstream.searchParams.set('from', '01-2023')
    upstream.searchParams.set('to', '12-2023')
    upstream.searchParams.set('type', 'totals')
    upstream.searchParams.set('API_KEY', apiKey)

    try {
      const result = await fetch(upstream)
      const body = await result.text()
      response.statusCode = result.status
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(JSON.stringify({ error: 'FBI crime data is unavailable.' }))
    }
  }

  return {
    name: 'homeintel-fbi-crime-proxy',
    configureServer(server) {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiKey = env.DATA_GOV_API_KEY || env.VITE_DATA_GOV_API_KEY || ''
  return { plugins: [react(), tailwindcss(), fbiCrimeProxy(apiKey)] }
})
