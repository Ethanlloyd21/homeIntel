import type { City } from '../data/cities'

export type HazardRisk = {
  label: string
  score: number
  rating: string
  tone: 'high' | 'medium' | 'low'
}

export type RiskData = {
  score: number
  rating: string
  statePercentile: number
  county: string
  resilienceScore: number | null
  resilienceRating: string | null
  version: string
  hazards: HazardRisk[]
}

type Attributes = Record<string, string | number | null>

type ArcGisResponse = {
  features?: { attributes: Attributes }[]
  error?: { message?: string }
}

const serviceUrl =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0/query'

const hazards = [
  ['Avalanche', 'AVLN'],
  ['Coastal flooding', 'CFLD'],
  ['Cold wave', 'CWAV'],
  ['Drought', 'DRGT'],
  ['Earthquake', 'ERQK'],
  ['Hail', 'HAIL'],
  ['Heat wave', 'HWAV'],
  ['Hurricane', 'HRCN'],
  ['Ice storm', 'ISTM'],
  ['Inland flooding', 'IFLD'],
  ['Landslide', 'LNDS'],
  ['Lightning', 'LTNG'],
  ['Strong wind', 'SWND'],
  ['Tornado', 'TRND'],
  ['Tsunami', 'TSUN'],
  ['Volcanic activity', 'VLCN'],
  ['Wildfire', 'WFIR'],
  ['Winter weather', 'WNTW'],
] as const

function tone(score: number): HazardRisk['tone'] {
  if (score >= 80) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export async function fetchRiskData(city: City, signal: AbortSignal) {
  if (city.country !== 'United States') {
    throw new Error('FEMA risk data is available for U.S. locations only.')
  }

  const hazardFields = hazards.flatMap(([, code]) => [
    `${code}_RISKS`,
    `${code}_RISKR`,
  ])
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    geometry: `${city.longitude},${city.latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: [
      'COUNTY',
      'RISK_SCORE',
      'RISK_RATNG',
      'RISK_SPCTL',
      'RESL_SCORE',
      'RESL_RATNG',
      'NRI_VER',
      ...hazardFields,
    ].join(','),
    returnGeometry: 'false',
  })
  const response = await fetch(`${serviceUrl}?${params}`, { signal })
  if (!response.ok) throw new Error('Unable to load FEMA risk data.')

  const payload = (await response.json()) as ArcGisResponse
  const attributes = payload.features?.[0]?.attributes
  if (!attributes) {
    throw new Error(payload.error?.message ?? 'No FEMA risk profile was found.')
  }

  const hazardRisks = hazards
    .reduce<HazardRisk[]>((results, [label, code]) => {
      const score = attributes[`${code}_RISKS`]
      if (typeof score !== 'number') return results
      results.push({
        label,
        score: Math.round(score),
        rating: String(attributes[`${code}_RISKR`] ?? 'Not rated'),
        tone: tone(score),
      })
      return results
    }, [])
    .sort((a, b) => b.score - a.score)

  return {
    score: Math.round(Number(attributes.RISK_SCORE)),
    rating: String(attributes.RISK_RATNG ?? 'Not rated'),
    statePercentile: Math.round(Number(attributes.RISK_SPCTL)),
    county: String(attributes.COUNTY ?? ''),
    resilienceScore:
      typeof attributes.RESL_SCORE === 'number'
        ? Math.round(attributes.RESL_SCORE)
        : null,
    resilienceRating:
      typeof attributes.RESL_RATNG === 'string' ? attributes.RESL_RATNG : null,
    version: String(attributes.NRI_VER ?? 'December 2025'),
    hazards: hazardRisks,
  } satisfies RiskData
}
