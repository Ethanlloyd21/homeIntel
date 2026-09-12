export const damageDollars = (raw: string | undefined): number | null => {
  if (!raw?.trim()) return null
  const match = /^([\d.]+)\s*([KMB]?)$/i.exec(raw.trim())
  if (!match || !Number.isFinite(Number(match[1]))) return null
  return (
    Number(match[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[match[2].toUpperCase()] ?? 1)
  )
}

/** NOAA narratives can contain commas, escaped quotes, and embedded newlines. */
export const csvRows = (text: string): ArrayIterator<string[]> => {
  const rows: string[][] = []
  let row: string[] = [],
    value = '',
    quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"'
        i++
      } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if (char === '\n' && !quoted) {
      row.push(value.replace(/\r$/, ''))
      rows.push(row)
      row = []
      value = ''
    } else value += char
  }
  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }
  return rows[Symbol.iterator]()
}

export type StormEvent = {
  id: string
  date: string
  type: string
  area: string
  property: number | null
  crop: number | null
  deaths: number
  injuries: number
  narrative: string
}
export type StormArea = {
  name: string
  kind: 'county' | 'forecast zone'
  count: number
  property: number
  crop: number
  unknownLoss: number
  deaths: number
  injuries: number
  years: Record<string, { count: number; property: number; crop: number }>
  hazards: Record<
    string,
    { count: number; property: number; crop: number; months: number[] }
  >
  recent: StormEvent[]
  costliest: StormEvent[]
}

export const addStormEvent = (area: StormArea, event: StormEvent) => {
  area.count++
  area.property += event.property ?? 0
  area.crop += event.crop ?? 0
  area.unknownLoss += Number(event.property === null || event.crop === null)
  area.deaths += event.deaths
  area.injuries += event.injuries
  const year = event.date.slice(0, 4)
  const yearly = (area.years[year] ??= { count: 0, property: 0, crop: 0 })
  yearly.count++
  yearly.property += event.property ?? 0
  yearly.crop += event.crop ?? 0
  const hazard = (area.hazards[event.type] ??= {
    count: 0,
    property: 0,
    crop: 0,
    months: Array(12).fill(0),
  })
  hazard.count++
  hazard.property += event.property ?? 0
  hazard.crop += event.crop ?? 0
  hazard.months[Number(event.date.slice(5, 7)) - 1]++
  area.recent = [...area.recent, event]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
  area.costliest = [...area.costliest, event]
    .filter((e) => (e.property ?? 0) + (e.crop ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.property ?? 0) + (b.crop ?? 0) - (a.property ?? 0) - (a.crop ?? 0),
    )
    .slice(0, 6)
}
