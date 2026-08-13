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

let lausFlatDataPromise: Promise<string> | null = null

function getLausFlatData() {
  lausFlatDataPromise ??= Promise.all(
    ['CurrentU15-19', 'CurrentU20-24', 'CurrentU25-29'].map(async (period) => {
      const response = await fetch(
        `https://download.bls.gov/pub/time.series/la/la.data.0.${period}`,
      )
      if (!response.ok) throw new Error(`BLS LAUS ${period} is unavailable.`)
      return response.text()
    }),
  ).then((files) => files.join('\n'))
  return lausFlatDataPromise
}

function currentEconomyProxy(censusKey: string, beaKey: string): Plugin {
  const numberValue = (value: unknown) => {
    const parsed = Number(String(value ?? '').replaceAll(',', ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/current-economy') return next()
    response.setHeader('Content-Type', 'application/json')
    const city = requestUrl.searchParams.get('city')?.trim() ?? ''
    const stateName = requestUrl.searchParams.get('state')?.trim() ?? ''
    const state = statePattern.test(stateName.toUpperCase())
      ? stateName.toUpperCase()
      : stateCodes[stateName]
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (
      !city ||
      !state ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'A valid U.S. city is required.' }))
      return
    }

    try {
      const geographyResponse = await fetch(
        `https://geo.fcc.gov/api/census/block/find?latitude=${latitude}&longitude=${longitude}&format=json`,
      )
      const geography = (await geographyResponse.json()) as {
        County?: { FIPS?: string; name?: string }
        State?: { FIPS?: string; name?: string }
      }
      const countyFips = geography.County?.FIPS ?? ''
      const stateFips = geography.State?.FIPS ?? countyFips.slice(0, 2)
      const countyCode = countyFips.slice(2)

      const lausPromise = (async () => {
        const areaText = await (
          await fetch('https://download.bls.gov/pub/time.series/la/la.area')
        ).text()
        const row = areaText
          .split(/\r?\n/)
          .map((line) => line.split('\t'))
          .find(
            ([type, , label]) =>
              type === 'G' &&
              label?.toLowerCase().startsWith(`${city.toLowerCase()} `) &&
              label.endsWith(`, ${state}`),
          )
        if (!row?.[1]) return null
        const seriesIds = ['05', '04', '03', '06'].map(
          (measure) => `LAU${row[1]}${measure}`,
        )
        type BlsSeries = {
          seriesID: string
          data: {
            year: string
            period: string
            periodName: string
            value: string
            latest?: string
          }[]
        }
        let bls = (await (
          await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              seriesid: seriesIds,
              startyear: '2019',
              endyear: String(new Date().getFullYear()),
            }),
          })
        ).json()) as {
          Results?: {
            series?: BlsSeries[]
          }
        }
        if (!bls.Results?.series?.some((series) => series.data.length > 0)) {
          const currentData = await getLausFlatData()
          const seriesMap = new Map(
            seriesIds.map((seriesID) => [seriesID, [] as BlsSeries['data']]),
          )
          for (const line of currentData.split(/\r?\n/)) {
            const [rawSeriesId, year, period, rawValue] = line.split('\t')
            const seriesID = rawSeriesId?.trim()
            const target = seriesMap.get(seriesID)
            if (!target || Number(year) < 2019 || !/^M\d{2}$/.test(period))
              continue
            target.push({
              year,
              period,
              periodName:
                period === 'M13'
                  ? 'Annual average'
                  : new Date(2000, Number(period.slice(1)) - 1).toLocaleString(
                      'en-US',
                      { month: 'long' },
                    ),
              value: rawValue.trim(),
            })
          }
          bls = {
            Results: {
              series: [...seriesMap].map(([seriesID, data]) => ({
                seriesID,
                data: data.sort(
                  (a, b) =>
                    Number(b.year) - Number(a.year) ||
                    Number(b.period.slice(1)) - Number(a.period.slice(1)),
                ),
              })),
            },
          }
        }
        const latest = (id: string) =>
          bls.Results?.series
            ?.find((series) => series.seriesID === id)
            ?.data?.find((item) => /^M(0[1-9]|1[0-2])$/.test(item.period))
        const employment = latest(seriesIds[0])
        const unemployment = latest(seriesIds[1])
        const rate = latest(seriesIds[2])
        const laborForce = latest(seriesIds[3])
        const employmentSeries =
          bls.Results?.series?.find(
            (series) => series.seriesID === seriesIds[0],
          )?.data ?? []
        const annualEmployment = Array.from(
          new Set(employmentSeries.map((item) => Number(item.year))),
        )
          .sort((a, b) => a - b)
          .map((year) => {
            const months = employmentSeries.filter(
              (item) =>
                Number(item.year) === year &&
                /^M(0[1-9]|1[0-2])$/.test(item.period),
            )
            const values = months
              .map((item) => numberValue(item.value))
              .filter((value): value is number => value !== null)
            return values.length > 0
              ? {
                  year,
                  employed: Math.round(
                    values.reduce((sum, value) => sum + value, 0) /
                      values.length,
                  ),
                  monthsReported: values.length,
                }
              : null
          })
          .filter(
            (
              item,
            ): item is {
              year: number
              employed: number
              monthsReported: number
            } => item !== null,
          )
          .map((item, index, values) => ({
            ...item,
            changePercent:
              index === 0
                ? null
                : ((item.employed - values[index - 1].employed) /
                    values[index - 1].employed) *
                  100,
          }))
        return employment && rate
          ? {
              employment: numberValue(employment.value),
              unemployment: numberValue(unemployment?.value),
              unemploymentRate: numberValue(rate.value),
              laborForce: numberValue(laborForce?.value),
              period: `${employment.periodName} ${employment.year}`,
              geography: `${city}, ${state}`,
              annualEmployment,
            }
          : null
      })()

      const qcewPromise = (async () => {
        for (const [year, quarter] of [
          [2025, 4],
          [2025, 3],
          [2025, 2],
          [2025, 1],
          [2024, 4],
        ]) {
          const result = await fetch(
            `https://data.bls.gov/cew/data/api/${year}/${quarter}/area/${countyFips}.csv`,
          )
          if (!result.ok) continue
          const lines = (await result.text()).trim().split(/\r?\n/)
          const parse = (line: string) =>
            line
              .match(/("[^"]*"|[^,]+)(?=,|$)/g)
              ?.map((item) => item.replace(/^"|"$/g, '').trim()) ?? []
          const headers = parse(lines[0])
          const records = lines.slice(1).map(parse)
          const get = (row: string[], field: string) =>
            row[headers.indexOf(field)]
          const total = records.find(
            (row) =>
              get(row, 'own_code') === '0' &&
              get(row, 'industry_code') === '10',
          )
          if (!total) continue
          const employmentValues = [
            'month1_emplvl',
            'month2_emplvl',
            'month3_emplvl',
          ].map((field) => numberValue(get(total, field)) ?? 0)
          return {
            period: `${year} Q${quarter}`,
            geography: geography.County?.name ?? countyFips,
            employment: Math.round(
              employmentValues.reduce((sum, value) => sum + value, 0) / 3,
            ),
            averageWeeklyWage: numberValue(get(total, 'avg_wkly_wage')),
            employmentGrowthPercent: numberValue(
              get(total, 'oty_month3_emplvl_pct_chg') ??
                get(total, 'oty_qtrly_emplvl_pct_chg'),
            ),
          }
        }
        return null
      })()

      const qwiPromise = (async () => {
        if (!censusKey || !countyCode) return null
        for (const [year, quarter] of [
          [2025, 2],
          [2025, 1],
          [2024, 4],
          [2024, 3],
        ]) {
          const url = new URL('https://api.census.gov/data/timeseries/qwi/rh')
          url.searchParams.set('get', 'Emp,HirA,Sep,EarnS')
          url.searchParams.set('for', `county:${countyCode}`)
          url.searchParams.set('in', `state:${stateFips}`)
          url.searchParams.set('year', String(year))
          url.searchParams.set('quarter', String(quarter))
          url.searchParams.set('key', censusKey)
          const result = await fetch(url)
          if (!result.ok) continue
          const rows = (await result.json()) as string[][]
          if (!rows[1]) continue
          return {
            period: `${year} Q${quarter}`,
            geography: geography.County?.name ?? countyFips,
            employment: numberValue(rows[1][0]),
            hires: numberValue(rows[1][1]),
            separations: numberValue(rows[1][2]),
            averageMonthlyEarnings: numberValue(rows[1][3]),
          }
        }
        return null
      })()

      const beaPromise = (async () => {
        if (!beaKey || !countyFips) return null
        const url = new URL('https://apps.bea.gov/api/data')
        Object.entries({
          UserID: beaKey,
          method: 'GetData',
          datasetname: 'Regional',
          TableName: 'CAGDP9',
          LineCode: '1',
          GeoFIPS: countyFips,
          Year: 'LAST5',
          ResultFormat: 'JSON',
        }).forEach(([key, value]) => url.searchParams.set(key, value))
        const result = (await (await fetch(url)).json()) as {
          BEAAPI?: {
            Results?: {
              Data?: {
                GeoName: string
                TimePeriod: string
                DataValue: string
              }[]
            }
          }
        }
        const values = result.BEAAPI?.Results?.Data ?? []
        const latest = values.at(-1)
        const previous = values.at(-2)
        const latestValue = numberValue(latest?.DataValue)
        const previousValue = numberValue(previous?.DataValue)
        return latest && latestValue !== null && previousValue
          ? {
              year: Number(latest.TimePeriod),
              geography: latest.GeoName,
              realGdp: latestValue,
              growthPercent:
                ((latestValue - previousValue) / previousValue) * 100,
            }
          : null
      })()

      const [laus, qcew, qwi, bea] = await Promise.all([
        lausPromise,
        qcewPromise,
        qwiPromise,
        beaPromise,
      ])
      response.end(
        JSON.stringify({
          county: geography.County?.name,
          laus,
          qcew,
          qwi,
          bea,
        }),
      )
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'Current economic data is unavailable.' }),
      )
    }
  }
  return {
    name: 'homeintel-current-economy-proxy',
    configureServer(server) {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest)
    },
  }
}

function majorEmployersProxy(): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/major-employers') return next()
    response.setHeader('Content-Type', 'application/json')
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Valid coordinates are required.' }))
      return
    }
    const query = `
      SELECT DISTINCT ?company ?companyLabel ?description ?website ?logo
        ?employees ?industryLabel ?distance
      WHERE {
        ?company wdt:P159 ?headquarters.
        SERVICE wikibase:around {
          ?headquarters wdt:P625 ?coordinate.
          bd:serviceParam wikibase:center "Point(${longitude} ${latitude})"^^geo:wktLiteral;
                          wikibase:radius "85";
                          wikibase:distance ?distance.
        }
        ?company wdt:P1128 ?employees.
        FILTER(?employees >= 1000)
        OPTIONAL { ?company wdt:P452 ?industry. }
        OPTIONAL { ?company wdt:P856 ?website. }
        OPTIONAL { ?company wdt:P154 ?logo. }
        OPTIONAL {
          ?company schema:description ?description.
          FILTER(LANG(?description) = "en")
        }
        SERVICE wikibase:label {
          bd:serviceParam wikibase:language "en".
        }
      }
      ORDER BY DESC(?employees)
      LIMIT 60`
    const upstream = new URL('https://query.wikidata.org/sparql')
    upstream.searchParams.set('query', query)
    upstream.searchParams.set('format', 'json')
    try {
      const result = await fetch(upstream, {
        headers: {
          Accept: 'application/sparql-results+json',
          'User-Agent': 'HomeIntel/0.1 (city research application)',
        },
      })
      const body = await result.text()
      response.statusCode = result.status
      response.end(body)
    } catch {
      response.statusCode = 502
      response.end(JSON.stringify({ error: 'Wikidata is unavailable.' }))
    }
  }
  return {
    name: 'homeintel-major-employers-proxy',
    configureServer(server) {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest)
    },
  }
}

function federalContractorsProxy(): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/federal-contractors') return next()
    response.setHeader('Content-Type', 'application/json')
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Valid coordinates are required.' }))
      return
    }
    try {
      const latitudeOffset = 45 / 69
      const longitudeOffset = 45 / (69 * Math.cos((latitude * Math.PI) / 180))
      const samples = [
        [latitude, longitude],
        [latitude + latitudeOffset, longitude],
        [latitude - latitudeOffset, longitude],
        [latitude, longitude + longitudeOffset],
        [latitude, longitude - longitudeOffset],
        [latitude + latitudeOffset * 0.7, longitude + longitudeOffset * 0.7],
        [latitude + latitudeOffset * 0.7, longitude - longitudeOffset * 0.7],
        [latitude - latitudeOffset * 0.7, longitude + longitudeOffset * 0.7],
        [latitude - latitudeOffset * 0.7, longitude - longitudeOffset * 0.7],
      ]
      const geographies = await Promise.all(
        samples.map(async ([lat, lon]) => {
          const result = await fetch(
            `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lon}&format=json`,
          )
          return (await result.json()) as {
            County?: { FIPS?: string; name?: string }
            State?: { code?: string }
          }
        }),
      )
      const locations = new Map<
        string,
        { country: string; state: string; county: string }
      >()
      for (const geography of geographies) {
        const fips = geography.County?.FIPS
        const state = geography.State?.code
        if (fips && state)
          locations.set(fips, { country: 'USA', state, county: fips.slice(2) })
      }
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setFullYear(startDate.getFullYear() - 3)
      const upstream = await fetch(
        'https://api.usaspending.gov/api/v2/search/spending_by_category/recipient/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: {
              time_period: [
                {
                  start_date: startDate.toISOString().slice(0, 10),
                  end_date: endDate.toISOString().slice(0, 10),
                },
              ],
              place_of_performance_locations: [...locations.values()],
              award_type_codes: ['A', 'B', 'C', 'D'],
            },
            category: 'recipient',
            limit: 60,
            page: 1,
            spending_level: 'transactions',
          }),
        },
      )
      if (!upstream.ok) {
        response.statusCode = upstream.status
        response.end(await upstream.text())
        return
      }
      const spending = (await upstream.json()) as {
        results?: {
          recipient_id: string
          name: string
          amount: number
          website?: string
          description?: string
        }[]
        [key: string]: unknown
      }
      const normalizeCompanyName = (name: string) =>
        name
          .replace(/[.,]/g, '')
          .replace(
            /\b(CORPORATION|COMPANY|INCORPORATED|INC|LLC|LP|LTD)\b/gi,
            '',
          )
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase()
      const enriched = await Promise.all(
        (spending.results ?? []).map(async (recipient, index) => {
          if (index >= 20) return recipient
          try {
            const searchUrl = new URL('https://www.wikidata.org/w/api.php')
            searchUrl.search = new URLSearchParams({
              action: 'wbsearchentities',
              search: normalizeCompanyName(recipient.name),
              language: 'en',
              uselang: 'en',
              type: 'item',
              limit: '3',
              format: 'json',
              origin: '*',
            }).toString()
            const searchResult = (await (
              await fetch(searchUrl, {
                headers: {
                  'User-Agent': 'HomeIntel/0.1 (city research application)',
                },
              })
            ).json()) as {
              search?: { id: string; label: string; description?: string }[]
            }
            const requestedName = normalizeCompanyName(recipient.name)
            const match = searchResult.search?.find((candidate) => {
              const candidateName = normalizeCompanyName(candidate.label)
              return (
                candidateName === requestedName ||
                requestedName.includes(candidateName) ||
                candidateName.includes(requestedName)
              )
            })
            if (!match) return recipient
            const entityUrl = new URL('https://www.wikidata.org/w/api.php')
            entityUrl.search = new URLSearchParams({
              action: 'wbgetentities',
              ids: match.id,
              props: 'claims',
              format: 'json',
              origin: '*',
            }).toString()
            const entityResult = (await (
              await fetch(entityUrl, {
                headers: {
                  'User-Agent': 'HomeIntel/0.1 (city research application)',
                },
              })
            ).json()) as {
              entities?: Record<
                string,
                {
                  claims?: Record<
                    string,
                    { mainsnak?: { datavalue?: { value?: unknown } } }[]
                  >
                }
              >
            }
            const website = entityResult.entities?.[
              match.id
            ]?.claims?.P856?.find(
              (claim) => typeof claim.mainsnak?.datavalue?.value === 'string',
            )?.mainsnak?.datavalue?.value
            return {
              ...recipient,
              website: typeof website === 'string' ? website : undefined,
              description: match.description,
            }
          } catch {
            return recipient
          }
        }),
      )
      response.end(JSON.stringify({ ...spending, results: enriched }))
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'USAspending data is unavailable.' }),
      )
    }
  }
  return {
    name: 'homeintel-federal-contractors-proxy',
    configureServer(server) {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest)
    },
  }
}

function majorHospitalsProxy(): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (requestUrl.pathname !== '/api/major-hospitals') return next()
    response.setHeader('Content-Type', 'application/json')
    const latitude = Number(requestUrl.searchParams.get('latitude'))
    const longitude = Number(requestUrl.searchParams.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'Valid coordinates are required.' }))
      return
    }
    try {
      const upstream = new URL(
        'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Hospitals_hifld/FeatureServer/0/query',
      )
      Object.entries({
        where: "STATUS = 'OPEN'",
        geometry: `${longitude},${latitude}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        distance: '50',
        units: 'esriSRUnit_StatuteMile',
        outFields:
          'ID,NAME,ADDRESS,CITY,STATE,TYPE,STATUS,WEBSITE,OWNER,TTL_STAFF,BEDS,TRAUMA,LATITUDE,LONGITUDE',
        returnGeometry: 'false',
        f: 'json',
      }).forEach(([key, value]) => upstream.searchParams.set(key, value))
      const result = await fetch(upstream, {
        signal: AbortSignal.timeout(15_000),
      })
      response.statusCode = result.status
      response.end(await result.text())
    } catch {
      response.statusCode = 502
      response.end(
        JSON.stringify({ error: 'Hospital information is unavailable.' }),
      )
    }
  }
  return {
    name: 'homeintel-major-hospitals-proxy',
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
  const censusKey = env.VITE_CENSUS_API_KEY || ''
  const beaKey = env.BEA_API_KEY || ''
  return {
    plugins: [
      react(),
      tailwindcss(),
      fbiCrimeProxy(apiKey),
      collegeScorecardProxy(apiKey),
      currentEconomyProxy(censusKey, beaKey),
      majorEmployersProxy(),
      federalContractorsProxy(),
      majorHospitalsProxy(),
    ],
  }
})
