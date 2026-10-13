import { cityGuidePath, publicCities } from 'data/publicCities'
import { normalizePath, viewPaths } from 'utils/routes'

export const siteUrl = 'https://mycityintel.com'
export const siteDescription =
  'Compare U.S. cities with sourced housing, population, employment, climate, and risk data. Plan your budget and next move with MyCityIntel.'

const viewDetails: Record<string, [string, string]> = {
  Overview: [
    'City overview',
    'Explore housing, demographics, employment, climate, and risk in one city research workspace.',
  ],
  Housing: [
    'Housing research',
    'Research home values, rents, housing tenure, and historical city market trends.',
  ],
  People: [
    'Population and demographics',
    'Explore population, income, education, and household demographics with source dates.',
  ],
  Employment: [
    'Jobs and local economy',
    'Research employment, industries, major employers, and local economic indicators.',
  ],
  Risk: [
    'City risk profile',
    'Investigate reported crime and natural hazard evidence with geographic context.',
  ],
  Environment: [
    'Climate and weather',
    'Explore seasonal climate, historical storms, and weather comfort for your preferences.',
  ],
  Neighborhoods: [
    'Neighborhood research',
    'Compare pinned locations, nearby schools, services, and commute considerations.',
  ],
  Simulator: [
    'Life simulator',
    'Build an editable household budget and compare your assumptions with city data.',
  ],
  DayInLife: [
    'Day in your life',
    'Explore how climate, commutes, and household assumptions shape an ordinary day.',
  ],
  Brief: [
    'Decision brief',
    'Review an explainable relocation decision with evidence, estimates, and gaps.',
  ],
  MovePlan: [
    'Move plan',
    'Build a moving budget, research-trip checklist, and a 90-day move timeline.',
  ],
  Compare: [
    'Compare cities',
    'Compare two cities across housing, people, employment, climate, and risk.',
  ],
}

export const publicPageAt = (pathname: string) => {
  const path = normalizePath(pathname)
  if (path === '/cities') return { kind: 'directory' as const }
  if (path === '/about') return { kind: 'about' as const }
  const city = publicCities.find(
    (entry) => normalizePath(cityGuidePath(entry)) === path,
  )
  if (city) return { kind: 'city' as const, city }
  if (path === '/404' || path === '/404.html' || path.startsWith('/cities/'))
    return { kind: 'missing' as const }
  return null
}

export const metadataForPath = (pathname: string, cityLabel?: string) => {
  const path = normalizePath(pathname)
  const page = publicPageAt(path)
  if (path === '/')
    return {
      title: 'MyCityIntel | Research U.S. cities before you move',
      description: siteDescription,
      canonical: `${siteUrl}/`,
      index: true,
      type: 'WebPage',
    }
  if (page?.kind === 'directory')
    return {
      title: 'U.S. city research guides | MyCityIntel',
      description:
        'Browse sourced housing snapshots and relocation research guides for Austin, Chicago, Denver, Raleigh, San Francisco, and Seattle.',
      canonical: `${siteUrl}/cities/`,
      index: true,
      type: 'CollectionPage',
    }
  if (page?.kind === 'about')
    return {
      title: 'Data sources and methodology | MyCityIntel',
      description:
        'Learn how MyCityIntel uses public data, labels estimates, protects household inputs, and explains the limits of relocation research.',
      canonical: `${siteUrl}/about/`,
      index: true,
      type: 'AboutPage',
    }
  if (page?.kind === 'city') {
    const label = `${page.city.name}, ${page.city.admin1}`
    return {
      title: `Moving to ${label}: housing and city research | MyCityIntel`,
      description: `Research moving to ${label} with a dated Zillow housing snapshot, source definitions, and tools for costs, jobs, climate, and risk.`,
      canonical: `${siteUrl}${cityGuidePath(page.city)}`,
      index: true,
      type: 'WebPage',
    }
  }
  const view = Object.entries(viewPaths).find(([, url]) => url === path)?.[0]
  const details = view ? viewDetails[view] : null
  return {
    title: `${details?.[0] ?? 'Page not found'}${cityLabel ? ` — ${cityLabel}` : ''} | MyCityIntel`,
    description:
      details?.[1] ??
      'The requested page is unavailable. Browse MyCityIntel city guides or return to the app.',
    canonical: `${siteUrl}${path}`,
    index: false,
    type: 'WebPage',
  }
}

export const structuredDataForPath = (pathname: string) => {
  const meta = metadataForPath(pathname)
  const page = publicPageAt(pathname)
  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'MyCityIntel',
    url: `${siteUrl}/`,
    description: siteDescription,
    inLanguage: 'en-US',
  }
  const webpage = {
    '@type': meta.type,
    '@id': `${meta.canonical}#webpage`,
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': website['@id'] },
    inLanguage: 'en-US',
    ...(page?.kind === 'city'
      ? {
          about: {
            '@type': 'City',
            name: page.city.name,
            containedInPlace: { '@type': 'State', name: page.city.admin1 },
          },
        }
      : {}),
  }
  const breadcrumbs =
    page && page.kind !== 'missing'
      ? [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${siteUrl}/`,
              },
              ...(page.kind === 'city'
                ? [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: 'City guides',
                      item: `${siteUrl}/cities/`,
                    },
                  ]
                : []),
              {
                '@type': 'ListItem',
                position: page.kind === 'city' ? 3 : 2,
                name:
                  page.kind === 'city'
                    ? page.city.name
                    : page.kind === 'directory'
                      ? 'City guides'
                      : 'Data and methodology',
                item: meta.canonical,
              },
            ],
          },
        ]
      : []
  return {
    '@context': 'https://schema.org',
    '@graph': [website, webpage, ...breadcrumbs],
  }
}

export const applyMetadata = (pathname: string, cityLabel?: string) => {
  const meta = metadataForPath(pathname, cityLabel)
  document.title = meta.title
  const setMeta = (key: string, content: string, property = false) => {
    const attribute = property ? 'property' : 'name'
    let element = document.head.querySelector<HTMLMetaElement>(
      `meta[${attribute}="${key}"]`,
    )
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, key)
      document.head.append(element)
    }
    element.content = content
  }
  setMeta('description', meta.description)
  setMeta(
    'robots',
    meta.index ? 'index,follow,max-image-preview:large' : 'noindex,follow',
  )
  for (const [key, value] of Object.entries({
    'og:title': meta.title,
    'og:description': meta.description,
    'og:url': meta.canonical,
    'og:site_name': 'MyCityIntel',
    'og:type': 'website',
  }))
    setMeta(key, value, true)
  setMeta('twitter:card', 'summary')
  setMeta('twitter:title', meta.title)
  setMeta('twitter:description', meta.description)
  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = meta.canonical
  let schema = document.getElementById('site-schema')
  if (!schema) {
    schema = document.createElement('script')
    schema.id = 'site-schema'
    schema.setAttribute('type', 'application/ld+json')
    document.head.append(schema)
  }
  schema.textContent = JSON.stringify(
    structuredDataForPath(pathname),
  ).replaceAll('<', '\\u003c')
}
