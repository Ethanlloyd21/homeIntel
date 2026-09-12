import type { City } from 'data/cities'

export type HazardRisk = {
  label: string
  score: number
  rating: string
  tone: 'high' | 'medium' | 'low'
  annualLoss: number | null
  buildingLoss: number | null
  annualFrequency: number | null
  historicalBuildingLossRatio: number | null
}

export type RiskData = {
  score: number
  rating: string
  statePercentile: number
  county: string
  tract: string
  resilienceScore: number | null
  resilienceRating: string | null
  version: string
  hazards: HazardRisk[]
  countyFips: string
  stateCode: string
  annualLoss: number | null
  buildingLoss: number | null
  agricultureLoss: number | null
  socialVulnerabilityScore: number | null
  socialVulnerabilityRating: string | null
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

const tone = (score: number): HazardRisk['tone'] => {
  if (score >= 80) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

const finiteScore = (value: string | number | null) => {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
    ? Math.round(value)
    : null
}

export const fetchRiskData = async (city: City, signal: AbortSignal) => {
  if (city.country !== 'United States') {
    throw new Error('FEMA risk data is available for U.S. locations only.')
  }

  const hazardFields = hazards.flatMap(([, code]) => [
    `${code}_EALS`,
    `${code}_EALR`,
    `${code}_EALT`,
    `${code}_AFREQ`,
    // FEMA drought exposure is agricultural; building fields do not exist.
    ...(code === 'DRGT' ? [] : [`${code}_EALB`, `${code}_HLRB`]),
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
      'TRACT',
      'EAL_SCORE',
      'EAL_RATNG',
      'EAL_SPCTL',
      'RESL_SCORE',
      'RESL_RATNG',
      'NRI_VER',
      'STCOFIPS',
      'STATEABBRV',
      'EAL_VALT',
      'EAL_VALB',
      'EAL_VALA',
      'SOVI_SCORE',
      'SOVI_RATNG',
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
      const score = attributes[`${code}_EALS`]
      const normalizedScore = finiteScore(score)
      if (normalizedScore === null) return results
      results.push({
        label,
        score: normalizedScore,
        rating: String(attributes[`${code}_EALR`] ?? 'Not rated'),
        tone: tone(normalizedScore),
        annualLoss: nonnegative(attributes[`${code}_EALT`]),
        buildingLoss: nonnegative(attributes[`${code}_EALB`]),
        annualFrequency: nonnegative(attributes[`${code}_AFREQ`]),
        historicalBuildingLossRatio: nonnegative(attributes[`${code}_HLRB`]),
      })
      return results
    }, [])
    .sort((a, b) => b.score - a.score)

  const score = finiteScore(attributes.EAL_SCORE)
  if (score === null) {
    throw new Error('FEMA did not provide a valid loss score for this tract.')
  }

  return {
    score,
    rating: String(attributes.EAL_RATNG ?? 'Not rated'),
    statePercentile: finiteScore(attributes.EAL_SPCTL) ?? 0,
    county: String(attributes.COUNTY ?? ''),
    tract: String(attributes.TRACT ?? ''),
    resilienceScore: finiteScore(attributes.RESL_SCORE),
    resilienceRating:
      typeof attributes.RESL_RATNG === 'string' ? attributes.RESL_RATNG : null,
    version: String(attributes.NRI_VER ?? 'Version not supplied'),
    hazards: hazardRisks,
    countyFips: String(attributes.STCOFIPS ?? '').padStart(5, '0'),
    stateCode: String(attributes.STATEABBRV ?? ''),
    annualLoss: nonnegative(attributes.EAL_VALT),
    buildingLoss: nonnegative(attributes.EAL_VALB),
    agricultureLoss: nonnegative(attributes.EAL_VALA),
    socialVulnerabilityScore: finiteScore(attributes.SOVI_SCORE),
    socialVulnerabilityRating:
      typeof attributes.SOVI_RATNG === 'string' ? attributes.SOVI_RATNG : null,
  } satisfies RiskData
}

const nonnegative = (value: string | number | null) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null
