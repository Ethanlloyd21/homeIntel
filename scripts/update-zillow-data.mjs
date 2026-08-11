import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ZHVI_URL =
  'https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv'
const ZORI_URL =
  'https://files.zillowstatic.com/research/public_csvs/zori/City_zori_uc_sfrcondomfr_sm_month.csv'

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"' && quoted && text[index + 1] === '"') {
      field += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

async function download(url) {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Zillow download failed (${response.status}): ${url}`)
  return parseCsv(await response.text())
}

function latestValue(row, headers) {
  for (let index = headers.length - 1; index >= 0; index -= 1) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(headers[index]) && row[index]) {
      const value = Number(row[index])
      if (Number.isFinite(value)) return { value, date: headers[index] }
    }
  }
  return null
}

function records(rows, field) {
  const [headers, ...values] = rows
  const index = Object.fromEntries(
    headers.map((header, position) => [header, position]),
  )
  const dateIndexes = headers
    .map((header, position) => ({ header, position }))
    .filter(({ header }) => /^\d{4}-\d{2}-\d{2}$/.test(header))
  const quarterlyIndexes = dateIndexes
    .filter((_, position) => (dateIndexes.length - 1 - position) % 3 === 0)
    .slice(-13)

  return {
    dates: quarterlyIndexes.map(({ header }) => header),
    records: values.flatMap((row) => {
      const latest = latestValue(row, headers)
      if (!latest) return []
      return [
        {
          city: row[index.RegionName],
          state: row[index.StateName] || row[index.State],
          [field]: Math.round(latest.value),
          [`${field}Date`]: latest.date,
          [`${field}History`]: quarterlyIndexes.map(({ position }) => {
            const value = Number(row[position])
            return Number.isFinite(value) ? Math.round(value) : null
          }),
        },
      ]
    }),
  }
}

const [zhviRows, zoriRows] = await Promise.all([
  download(ZHVI_URL),
  download(ZORI_URL),
])
const markets = new Map()
const homeValues = records(zhviRows, 'homeValue')
const rents = records(zoriRows, 'rent')

for (const record of homeValues.records) {
  markets.set(`${record.city}|${record.state}`.toLowerCase(), record)
}
for (const record of rents.records) {
  const key = `${record.city}|${record.state}`.toLowerCase()
  markets.set(key, { ...(markets.get(key) ?? record), ...record })
}

const output = {
  updatedAt: new Date().toISOString(),
  attribution: 'Zillow Research',
  sources: { zhvi: ZHVI_URL, zori: ZORI_URL },
  homeValueDates: homeValues.dates,
  rentDates: rents.dates,
  markets: [...markets.values()].sort((left, right) =>
    `${left.state}|${left.city}`.localeCompare(`${right.state}|${right.city}`),
  ),
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(scriptDirectory, '../public/data/zillow-market.json')
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output)}\n`, 'utf8')
console.log(
  `Saved ${output.markets.length} Zillow city records to ${outputPath}`,
)
