import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const statePattern = /^[A-Z]{2}$/
const stateCodes: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
}

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

function collegeScorecardProxy(apiKey: string): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/nearby-colleges') return next()

    const city = requestUrl.searchParams.get('city')?.trim() ?? ''
    const stateName = requestUrl.searchParams.get('state')?.trim() ?? ''
    const state = statePattern.test(stateName.toUpperCase())
      ? stateName.toUpperCase()
      : stateCodes[stateName]
    response.setHeader('Content-Type', 'application/json')
    if (!city || city.length > 100 || !state) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'A valid city is required.' }))
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
      'https://api.data.gov/ed/collegescorecard/v1/schools.json',
    )
    upstream.searchParams.set('api_key', apiKey)
    upstream.searchParams.set('school.state', state)
    upstream.searchParams.set('school.operating', '1')
    upstream.searchParams.set(
      'school.degrees_awarded.predominant__range',
      '2..4',
    )
    upstream.searchParams.set(
      'fields',
      [
        'id',
        'school.name',
        'school.city',
        'school.state',
        'location.lat',
        'location.lon',
        'school.school_url',
        'school.ownership',
        'school.degrees_awarded.highest',
        'latest.student.size',
        'latest.academics.program_percentage.computer',
        'latest.academics.program_percentage.engineering',
        'latest.academics.program_percentage.biological',
        'latest.academics.program_percentage.health',
        'latest.academics.program_percentage.business_marketing',
        'latest.academics.program_percentage.education',
        'latest.academics.program_percentage.visual_performing',
        'latest.academics.program_percentage.social_science',
      ].join(','),
    )
    upstream.searchParams.set('_per_page', '100')
    upstream.searchParams.set('_sort', 'latest.student.size:desc')

    try {
      const result = await fetch(upstream)
      const body = await result.text()
      response.statusCode = result.status
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'College Scorecard data is unavailable.' }),
      )
    }
  }

  return {
    name: 'homeintel-college-scorecard-proxy',
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
  return {
    plugins: [
      react(),
      tailwindcss(),
      fbiCrimeProxy(apiKey),
      collegeScorecardProxy(apiKey),
    ],
  }
})
