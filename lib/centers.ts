import { getSupabaseBrowserClient } from './supabase'
import type { Center, Viewport } from '@/types/domain'

export const KOREA_VIEWPORT: Viewport = {
  south: 33,
  north: 39,
  west: 124,
  east: 132,
}

export type BrowseMode = 'map' | 'nearby' | 'search'

export type CenterFilters = {
  keyword: string
  city: string
  district: string
  town: string
  typeName: string
}

export type FilterOptionRow = {
  city: string | null
  district: string | null
  town: string | null
  type_name: string | null
}

export type FilterOptionsTree = {
  cities: string[]
  districtsByCity: Record<string, string[]>
  townsByCityDistrict: Record<string, string[]>
  typeNames: string[]
}

type SearchCentersParams = Partial<CenterFilters> & {
  bounds?: Viewport
  limit?: number
}

type UpdateCenterProfileInput = Partial<
  Pick<
    Center,
    | 'address'
    | 'phone'
    | 'intro_text'
    | 'homepage_url'
    | 'hero_image_url'
    | 'capacity_total'
    | 'capacity_current'
  >
>

function compareKorean(a: string, b: string) {
  return a.localeCompare(b, 'ko')
}

function sortUnique(values: Iterable<string>) {
  return Array.from(new Set(values)).sort(compareKorean)
}

function createCityDistrictKey(city: string, district: string) {
  return `${city}__${district}`
}

function normalizeOption(value: string | null | undefined) {
  return value?.trim() || ''
}

export function getDistrictOptions(
  options: FilterOptionsTree,
  city: string
): string[] {
  if (!city) return []
  return options.districtsByCity[city] ?? []
}

export function getTownOptions(
  options: FilterOptionsTree,
  city: string,
  district: string
): string[] {
  if (!city || !district) return []
  return options.townsByCityDistrict[createCityDistrictKey(city, district)] ?? []
}

export async function getCenterFilterOptions(): Promise<FilterOptionsTree> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('center_filter_options')
    .select('city, district, town, type_name')
    .limit(50000)

  if (error) {
    throw error
  }

  const citySet = new Set<string>()
  const typeSet = new Set<string>()
  const districtsByCityMap = new Map<string, Set<string>>()
  const townsByCityDistrictMap = new Map<string, Set<string>>()

  for (const row of (data ?? []) as FilterOptionRow[]) {
    const city = normalizeOption(row.city)
    const district = normalizeOption(row.district)
    const town = normalizeOption(row.town)
    const typeName = normalizeOption(row.type_name)

    if (city) citySet.add(city)
    if (typeName) typeSet.add(typeName)

    if (city && district) {
      const districts = districtsByCityMap.get(city) ?? new Set<string>()
      districts.add(district)
      districtsByCityMap.set(city, districts)
    }

    if (city && district && town) {
      const key = createCityDistrictKey(city, district)
      const towns = townsByCityDistrictMap.get(key) ?? new Set<string>()
      towns.add(town)
      townsByCityDistrictMap.set(key, towns)
    }
  }

  const districtsByCity: Record<string, string[]> = {}
  const townsByCityDistrict: Record<string, string[]> = {}

  for (const [city, districts] of districtsByCityMap.entries()) {
    districtsByCity[city] = sortUnique(districts)
  }

  for (const [key, towns] of townsByCityDistrictMap.entries()) {
    townsByCityDistrict[key] = sortUnique(towns)
  }

  return {
    cities: sortUnique(citySet),
    districtsByCity,
    townsByCityDistrict,
    typeNames: sortUnique(typeSet),
  }
}

export async function getCentersByViewport(bounds: Viewport): Promise<Center[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .gte('latitude', bounds.south)
    .lte('latitude', bounds.north)
    .gte('longitude', bounds.west)
    .lte('longitude', bounds.east)
    .limit(300)

  if (error) {
    throw error
  }

  return (data ?? []) as Center[]
}

export async function searchCenters(
  params: SearchCentersParams
): Promise<Center[]> {
  const supabase = getSupabaseBrowserClient()

  let query = supabase.from('centers').select('*')

  if (params.bounds) {
    query = query
      .gte('latitude', params.bounds.south)
      .lte('latitude', params.bounds.north)
      .gte('longitude', params.bounds.west)
      .lte('longitude', params.bounds.east)
  }

  if (params.keyword?.trim()) {
    query = query.ilike('name', `%${params.keyword.trim()}%`)
  }

  if (params.city?.trim()) {
    query = query.eq('city', params.city.trim())
  }

  if (params.district?.trim()) {
    query = query.eq('district', params.district.trim())
  }

  if (params.town?.trim()) {
    query = query.eq('town', params.town.trim())
  }

  if (params.typeName?.trim()) {
    query = query.eq('type_name', params.typeName.trim())
  }

  const { data, error } = await query.limit(params.limit ?? 300)

  if (error) {
    throw error
  }

  return ((data ?? []) as Center[]).sort((a, b) => compareKorean(a.name ?? '', b.name ?? ''))
}

export async function updateCenterProfile(
  centerId: number,
  input: UpdateCenterProfileInput
) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase
    .from('centers')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', centerId)

  if (error) {
    throw error
  }
}
