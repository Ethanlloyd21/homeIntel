import type { City } from '../data/cities'

type Binding = Record<string, { value: string } | undefined>
type WikidataResponse = { results?: { bindings?: Binding[] } }

export type MajorEmployer = {
  id: string
  name: string
  description: string
  industries: string
  employees: number | null
  website: string
  logo: string
  sector: string
  federalObligations: number | null
  facilityBeds: number | null
  distanceMiles: number | null
  source: 'Wikidata' | 'USAspending' | 'HIFLD'
}

const strategicSectors = [
  {
    label: 'Defense & government',
    pattern:
      /defen[cs]e|military|aerospace|government contractor|security contractor/i,
  },
  {
    label: 'Technology',
    pattern:
      /technology|software|computer|semiconductor|electronics|information technology|artificial intelligence|telecommunication|internet/i,
  },
  {
    label: 'Health & life sciences',
    pattern: /health|hospital|medical|pharma|biotech|life science/i,
  },
  { label: 'Finance', pattern: /bank|financ|insurance|investment|payment/i },
  {
    label: 'Energy',
    pattern: /energy|petroleum|oil|gas|electric|utility|renewable/i,
  },
  {
    label: 'Transportation',
    pattern: /airline|aviation|transport|logistics|railroad|shipping/i,
  },
  {
    label: 'Advanced manufacturing',
    pattern: /manufactur|engineering|industrial|automotive|machinery/i,
  },
] as const

const majorCompanyProfiles = [
  [
    /lockheed martin/i,
    'https://www.lockheedmartin.com/',
    'Global aerospace and defense company known for advanced aircraft, missiles, space systems, and national security technology.',
    'Defense & government',
  ],
  [
    /raytheon|\brtx\b/i,
    'https://www.rtx.com/',
    'Aerospace and defense company whose businesses include Collins Aerospace, Pratt & Whitney, and Raytheon.',
    'Defense & government',
  ],
  [
    /boeing/i,
    'https://www.boeing.com/',
    'Global aerospace company producing commercial airplanes, defense systems, satellites, and space technology.',
    'Defense & government',
  ],
  [
    /l3harris/i,
    'https://www.l3harris.com/',
    'Defense technology company specializing in communications, sensing, space, and mission systems.',
    'Defense & government',
  ],
  [
    /northrop grumman/i,
    'https://www.northropgrumman.com/',
    'Aerospace and defense company focused on aircraft, space, cyber, and advanced weapons systems.',
    'Defense & government',
  ],
  [
    /general dynamics/i,
    'https://www.gd.com/',
    'Aerospace and defense company operating in aviation, marine systems, combat systems, and technology.',
    'Defense & government',
  ],
  [
    /bell textron|\btextron\b/i,
    'https://www.textron.com/',
    'Industrial and aerospace company known for Bell aircraft, aviation, defense, and specialized vehicles.',
    'Defense & government',
  ],
  [
    /bae systems/i,
    'https://www.baesystems.com/',
    'Defense, aerospace, and security company building military platforms, electronics, and mission systems.',
    'Defense & government',
  ],
  [
    /leidos/i,
    'https://www.leidos.com/',
    'Technology and engineering company supporting defense, intelligence, aviation, and health agencies.',
    'Technology',
  ],
  [
    /booz allen/i,
    'https://www.boozallen.com/',
    'Technology and consulting company serving defense, intelligence, and civil government organizations.',
    'Technology',
  ],
  [
    /science applications international|\bsaic\b/i,
    'https://www.saic.com/',
    'Technology integrator providing engineering, digital, and mission services to government customers.',
    'Technology',
  ],
  [
    /huntington ingalls|\bhii\b/i,
    'https://www.hii.com/',
    'Defense company specializing in shipbuilding, unmanned systems, cyber, and mission technologies.',
    'Defense & government',
  ],
  [
    /amentum/i,
    'https://www.amentum.com/',
    'Engineering and technology company supporting defense, energy, intelligence, and space missions.',
    'Defense & government',
  ],
  [
    /general atomics/i,
    'https://www.ga.com/',
    'Technology company developing unmanned aircraft, advanced sensors, energy systems, and defense products.',
    'Defense & government',
  ],
  [
    /mckesson/i,
    'https://www.mckesson.com/',
    'Healthcare company providing pharmaceutical distribution, medical supplies, and health technology.',
    'Health & life sciences',
  ],
  [
    /christus health/i,
    'https://www.christushealth.org/',
    'Nonprofit health system operating hospitals, clinics, and other care services.',
    'Health & life sciences',
  ],
  [
    /caterpillar/i,
    'https://www.caterpillar.com/',
    'Industrial manufacturer of construction and mining equipment, engines, turbines, and locomotives.',
    'Advanced manufacturing',
  ],
  [
    /fedex/i,
    'https://www.fedex.com/',
    'Global transportation and logistics company providing shipping, freight, and supply-chain services.',
    'Transportation',
  ],
  [
    /\bibm\b/i,
    'https://www.ibm.com/',
    'Global technology company focused on hybrid cloud, artificial intelligence, consulting, and infrastructure.',
    'Technology',
  ],
  [
    /microsoft/i,
    'https://www.microsoft.com/',
    'Global technology company developing cloud platforms, software, devices, and artificial intelligence products.',
    'Technology',
  ],
  [
    /amazon/i,
    'https://www.amazon.com/',
    'Global technology and logistics company operating e-commerce, cloud computing, and digital services.',
    'Technology',
  ],
  [
    /oracle/i,
    'https://www.oracle.com/',
    'Enterprise technology company providing cloud infrastructure, databases, and business software.',
    'Technology',
  ],
  [
    /deloitte/i,
    'https://www.deloitte.com/',
    'Professional services company providing consulting, technology, audit, and government services.',
    'Technology',
  ],
  [
    /jacobs/i,
    'https://www.jacobs.com/',
    'Engineering and technology company serving infrastructure, space, defense, and advanced manufacturing.',
    'Advanced manufacturing',
  ],
  [
    /\bfluor\b/i,
    'https://www.fluor.com/',
    'Engineering and construction company delivering large energy, infrastructure, and government projects.',
    'Advanced manufacturing',
  ],
  [
    /\bkbr\b/i,
    'https://www.kbr.com/',
    'Science, technology, and engineering company serving government and industrial customers.',
    'Defense & government',
  ],
] as const

function getMajorCompanyProfile(name: string) {
  const profile = majorCompanyProfiles.find(([pattern]) => pattern.test(name))
  return profile
    ? { website: profile[1], description: profile[2], sector: profile[3] }
    : null
}

function identifyStrategicSector(value: string) {
  return (
    strategicSectors.find(({ pattern }) => pattern.test(value))?.label ?? ''
  )
}

export async function fetchMajorEmployers(city: City, signal: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
  })
  const [wikidataResponse, federalResponse, hospitalsResponse] =
    await Promise.all([
      fetch(`/api/major-employers?${params}`, { signal }),
      fetch(`/api/federal-contractors?${params}`, { signal }),
      fetch(`/api/major-hospitals?${params}`, { signal }),
    ])
  if (!wikidataResponse.ok && !federalResponse.ok && !hospitalsResponse.ok)
    throw new Error('Unable to load major companies.')
  const payload = wikidataResponse.ok
    ? ((await wikidataResponse.json()) as WikidataResponse)
    : { results: { bindings: [] } }
  const companies = new Map<string, MajorEmployer>()
  for (const binding of payload.results?.bindings ?? []) {
    const id = binding.company?.value ?? ''
    if (!id) continue
    const existing = companies.get(id)
    const industry = binding.industryLabel?.value
    if (existing) {
      if (industry && existing.industries === 'Industry not reported')
        existing.industries = industry
      else if (industry && !existing.industries.includes(industry))
        existing.industries += `, ${industry}`
      existing.sector = identifyStrategicSector(
        `${existing.industries} ${existing.description}`,
      )
      continue
    }
    companies.set(id, {
      id,
      name: binding.companyLabel?.value ?? 'Unknown company',
      description:
        binding.description?.value ?? 'Organization headquartered in the area.',
      industries: industry || 'Industry not reported',
      employees: binding.employees?.value
        ? Number(binding.employees.value)
        : null,
      website: binding.website?.value ?? '',
      logo: binding.logo?.value ?? '',
      sector: identifyStrategicSector(
        `${industry ?? ''} ${binding.description?.value ?? ''}`,
      ),
      federalObligations: null,
      facilityBeds: null,
      distanceMiles: binding.distance?.value
        ? Number(binding.distance.value) * 0.621371
        : null,
      source: 'Wikidata',
    })
  }
  const wikidataCompanies = [...companies.values()]
    .filter(
      (company) =>
        !company.name.startsWith('Q') &&
        (company.employees ?? 0) >= 1000 &&
        company.sector !== '',
    )
    .sort((a, b) => (b.employees ?? 0) - (a.employees ?? 0))
    .slice(0, 18)
  const federalPayload = federalResponse.ok
    ? ((await federalResponse.json()) as {
        results?: {
          recipient_id: string
          name: string
          amount: number
          website?: string
          description?: string
        }[]
      })
    : { results: [] }
  const federalCompanies = new Map<string, MajorEmployer>()
  for (const recipient of federalPayload.results ?? []) {
    const profile = getMajorCompanyProfile(recipient.name)
    const normalizedName = recipient.name
      .replace(/[.,]/g, '')
      .replace(/\b(CORPORATION|COMPANY|INCORPORATED|INC|LLC)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
    const existing = federalCompanies.get(normalizedName)
    if (existing) {
      existing.federalObligations =
        (existing.federalObligations ?? 0) + recipient.amount
      if (!existing.website && (profile?.website || recipient.website))
        existing.website = profile?.website ?? recipient.website ?? ''
      if (recipient.description && !existing.description.includes('. '))
        existing.description = `${recipient.description.charAt(0).toUpperCase()}${recipient.description.slice(1)}. Federal contract work was performed in the surrounding region.`
      continue
    }
    federalCompanies.set(normalizedName, {
      id: recipient.recipient_id,
      name: recipient.name
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      description:
        profile?.description ??
        (recipient.description
          ? `${recipient.description.charAt(0).toUpperCase()}${recipient.description.slice(1)}. Federal contract work was performed in the surrounding region.`
          : 'Federal contractor with recent contract work performed in the surrounding region.'),
      industries: 'Federal contracting',
      employees: null,
      website: profile?.website ?? recipient.website ?? '',
      logo: '',
      sector: profile?.sector ?? 'Defense & government',
      federalObligations: recipient.amount,
      facilityBeds: null,
      distanceMiles: null,
      source: 'USAspending',
    })
  }
  const contractors = [...federalCompanies.values()]
    .filter(
      (company) =>
        (company.federalObligations ?? 0) >= 10_000_000 && company.website,
    )
    .sort((a, b) => (b.federalObligations ?? 0) - (a.federalObligations ?? 0))
    .slice(0, 12)
  const contractorNames = new Set(federalCompanies.keys())
  const hospitalPayload = hospitalsResponse.ok
    ? ((await hospitalsResponse.json()) as {
        features?: {
          attributes?: {
            ID?: string
            NAME?: string
            CITY?: string
            STATE?: string
            TYPE?: string
            WEBSITE?: string
            OWNER?: string
            TTL_STAFF?: number
            BEDS?: number
            TRAUMA?: string
            LATITUDE?: number
            LONGITUDE?: number
          }
        }[]
      })
    : { features: [] }
  const distanceMiles = (latitude: number, longitude: number) => {
    const radians = (degrees: number) => (degrees * Math.PI) / 180
    const latitudeDelta = radians(latitude - city.latitude)
    const longitudeDelta = radians(longitude - city.longitude)
    const value =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(city.latitude)) *
        Math.cos(radians(latitude)) *
        Math.sin(longitudeDelta / 2) ** 2
    return 3958.8 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  }
  const hospitals = new Map<string, MajorEmployer>()
  for (const hospital of hospitalPayload.features ?? []) {
    const attributes = hospital.attributes ?? {}
    const name = attributes.NAME?.trim()
    const latitude = attributes.LATITUDE
    const longitude = attributes.LONGITUDE
    if (!name || latitude === undefined || longitude === undefined) continue
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (hospitals.has(normalizedName)) continue
    const description = [
      attributes.TYPE || 'Hospital',
      attributes.OWNER ? `operated by ${attributes.OWNER}` : '',
      attributes.TRAUMA && attributes.TRAUMA !== 'NOT AVAILABLE'
        ? `${attributes.TRAUMA} trauma designation`
        : '',
    ]
      .filter(Boolean)
      .join(' ')
    hospitals.set(normalizedName, {
      id: `hospital-${attributes.ID ?? normalizedName}`,
      name,
      description: `${description} in ${attributes.CITY ?? 'the surrounding area'}, ${attributes.STATE ?? ''}.`,
      industries: 'Hospital and healthcare services',
      employees: attributes.TTL_STAFF || null,
      website:
        attributes.WEBSITE && !/^not available$/i.test(attributes.WEBSITE)
          ? /^https?:\/\//i.test(attributes.WEBSITE)
            ? attributes.WEBSITE
            : `https://${attributes.WEBSITE}`
          : '',
      logo: '',
      sector: 'Health & life sciences',
      federalObligations: null,
      facilityBeds: attributes.BEDS || null,
      distanceMiles: distanceMiles(latitude, longitude),
      source: 'HIFLD',
    })
  }
  const majorHospitals = [...hospitals.values()]
    .filter(
      (hospital) =>
        (hospital.facilityBeds ?? 0) >= 50 || (hospital.employees ?? 0) >= 250,
    )
    .sort(
      (a, b) =>
        (b.facilityBeds ?? 0) - (a.facilityBeds ?? 0) ||
        (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0),
    )
    .slice(0, 8)
  return [
    ...contractors,
    ...majorHospitals,
    ...wikidataCompanies.filter((company) => {
      const normalized = company.name
        .replace(/[.,]/g, '')
        .replace(/\b(CORPORATION|COMPANY|INCORPORATED|INC|LLC)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
      return !contractorNames.has(normalized)
    }),
  ]
}
