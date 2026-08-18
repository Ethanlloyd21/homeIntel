import type { City } from 'data/cities'

type SchoolApiRecord = {
  ncessch: string
  school_id: string
  leaid: string
  state_leaid: string
  seasch: string
  school_name: string
  lea_name: string
  street_mailing: string
  city_mailing: string
  state_mailing: string
  zip_mailing: string
  city_location: string
  state_location: string
  street_location: string
  zip_location: string
  phone: string | null
  latitude: number
  longitude: number
  csa: string | null
  cbsa: string | null
  urban_centric_locale: number | null
  county_code: string | null
  lowest_grade_offered: number | null
  highest_grade_offered: number | null
  enrollment: number
  teachers_fte: number
  school_status: number
  school_type: number
  bureau_indian_education: number | null
  title_i_status: number | null
  title_i_eligible: number | null
  title_i_schoolwide: number | null
  shared_time: number | null
  virtual: number | null
  free_lunch: number | null
  reduced_price_lunch: number | null
  free_or_reduced_price_lunch: number | null
  direct_certification: number | null
  lunch_program: number | null
  middle_cedp: number
  ungrade_cedp: number
  congress_district_id: number | null
  state_leg_district_lower: string | null
  state_leg_district_upper: string | null
  elem_cedp: number
  high_cedp: number
  charter: number
  magnet: number | null
  year: number
}

type SchoolsResponse = {
  results?: SchoolApiRecord[]
}

export type NearbySchool = {
  id: string
  name: string
  district: string
  location: string
  level: string
  enrollment: number
  teachersFte: number
  studentTeacherRatio: number
  distanceMiles: number
  charter: boolean
  magnet: boolean
  year: number
  metadata: {
    ncesSchoolId: string
    stateSchoolId: string
    ncesDistrictId: string
    stateDistrictId: string
    mailingAddress: string
    phone: string
    latitude: number
    longitude: number
    lowestGrade: number | null
    highestGrade: number | null
    schoolType: number
    schoolStatus: number
    elementary: number
    middle: number
    high: number
    ungraded: number
    bureauIndianEducation: number | null
    titleIStatus: number | null
    titleIEligible: number | null
    titleISchoolwide: number | null
    sharedTime: number | null
    virtual: number | null
    freeLunch: number | null
    reducedPriceLunch: number | null
    freeOrReducedLunch: number | null
    directCertification: number | null
    lunchProgram: number | null
    localeCode: number | null
    countyCode: string
    metroAreaCode: string
    combinedStatisticalAreaCode: string
    congressionalDistrict: number | null
    lowerLegislativeDistrict: string
    upperLegislativeDistrict: string
  }
}

export type NearbySchools = {
  preK: NearbySchool[]
  kindergarten: NearbySchool[]
  grades1To6: NearbySchool[]
  middleHigh: NearbySchool[]
  ungraded: NearbySchool[]
}

const distanceInMiles = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const latitudeDelta = radians(latitudeB - latitudeA)
  const longitudeDelta = radians(longitudeB - longitudeA)
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const toSchool = (
  school: SchoolApiRecord,
  city: City,
  level: string,
): NearbySchool => ({
  id: `${school.ncessch}-${level}`,
  name: school.school_name,
  district: school.lea_name,
  location: [
    school.street_location,
    `${school.city_location}, ${school.state_location} ${school.zip_location}`,
  ]
    .filter(Boolean)
    .join(', '),
  level,
  enrollment: school.enrollment,
  teachersFte: school.teachers_fte,
  studentTeacherRatio: school.enrollment / school.teachers_fte,
  distanceMiles: distanceInMiles(
    city.latitude,
    city.longitude,
    school.latitude,
    school.longitude,
  ),
  charter: school.charter === 1,
  magnet: school.magnet === 1,
  year: school.year,
  metadata: {
    ncesSchoolId: school.ncessch,
    stateSchoolId: school.seasch,
    ncesDistrictId: school.leaid,
    stateDistrictId: school.state_leaid,
    mailingAddress: [
      school.street_mailing,
      `${school.city_mailing}, ${school.state_mailing} ${school.zip_mailing}`,
    ]
      .filter(Boolean)
      .join(', '),
    phone: school.phone ?? '',
    latitude: school.latitude,
    longitude: school.longitude,
    lowestGrade: school.lowest_grade_offered,
    highestGrade: school.highest_grade_offered,
    schoolType: school.school_type,
    schoolStatus: school.school_status,
    elementary: school.elem_cedp,
    middle: school.middle_cedp,
    high: school.high_cedp,
    ungraded: school.ungrade_cedp,
    bureauIndianEducation: school.bureau_indian_education,
    titleIStatus: school.title_i_status,
    titleIEligible: school.title_i_eligible,
    titleISchoolwide: school.title_i_schoolwide,
    sharedTime: school.shared_time,
    virtual: school.virtual,
    freeLunch: school.free_lunch,
    reducedPriceLunch: school.reduced_price_lunch,
    freeOrReducedLunch: school.free_or_reduced_price_lunch,
    directCertification: school.direct_certification,
    lunchProgram: school.lunch_program,
    localeCode: school.urban_centric_locale,
    countyCode: school.county_code ?? '',
    metroAreaCode: school.cbsa ?? '',
    combinedStatisticalAreaCode: school.csa ?? '',
    congressionalDistrict: school.congress_district_id,
    lowerLegislativeDistrict: school.state_leg_district_lower ?? '',
    upperLegislativeDistrict: school.state_leg_district_upper ?? '',
  },
})

const selectSchools = (
  schools: SchoolApiRecord[],
  city: City,
  level: string,
  includesGradeBand: (school: SchoolApiRecord) => boolean,
) => {
  return schools
    .filter(
      (school) =>
        includesGradeBand(school) &&
        school.school_status === 1 &&
        school.school_type === 1 &&
        school.enrollment >= 100 &&
        school.teachers_fte > 0 &&
        Number.isFinite(school.latitude) &&
        Number.isFinite(school.longitude),
    )
    .map((school) => toSchool(school, city, level))
    .filter(
      (school) =>
        school.studentTeacherRatio >= 5 && school.studentTeacherRatio <= 30,
    )
    .sort(
      (a, b) =>
        a.studentTeacherRatio - b.studentTeacherRatio ||
        b.enrollment - a.enrollment,
    )
}

export const fetchNearbySchools = async (
  city: City,
  signal: AbortSignal,
): Promise<NearbySchools> => {
  if (city.country !== 'United States') {
    return {
      preK: [],
      kindergarten: [],
      grades1To6: [],
      middleHigh: [],
      ungraded: [],
    }
  }
  const params = new URLSearchParams({
    city: city.name,
    state: city.state,
    latitude: String(city.latitude),
    longitude: String(city.longitude),
  })
  const response = await fetch(`/api/nearby-schools?${params}`, { signal })
  if (!response.ok) throw new Error('Unable to load public schools.')
  const payload = (await response.json()) as SchoolsResponse
  const schools = payload.results ?? []
  return {
    preK: selectSchools(
      schools,
      city,
      'Pre-K',
      (school) => school.lowest_grade_offered === -1,
    ),
    kindergarten: selectSchools(
      schools,
      city,
      'Kindergarten',
      (school) =>
        school.lowest_grade_offered !== null &&
        school.highest_grade_offered !== null &&
        school.lowest_grade_offered <= 0 &&
        school.highest_grade_offered >= 0,
    ),
    grades1To6: selectSchools(
      schools,
      city,
      'Grades 1-6',
      (school) =>
        school.lowest_grade_offered !== null &&
        school.highest_grade_offered !== null &&
        school.lowest_grade_offered <= 6 &&
        school.highest_grade_offered >= 1,
    ),
    middleHigh: selectSchools(
      schools,
      city,
      'Middle & high school',
      (school) => school.middle_cedp === 1 || school.high_cedp === 1,
    ),
    ungraded: selectSchools(
      schools,
      city,
      'Ungraded',
      (school) => school.ungrade_cedp === 1,
    ),
  }
}
