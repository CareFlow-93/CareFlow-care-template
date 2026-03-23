import { getSupabaseBrowserClient } from './supabase'
import type { Center } from '@/types/domain'

export type NearbyCenterRow = Pick<Center, 'id' | 'name' | 'address' | 'latitude' | 'longitude'> & {
  distance: number
}

export async function getNearbyCenters(lat: number, lng: number, radiusKm = 10) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.rpc('get_nearby_centers', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
  })

  if (error) {
    throw error
  }

  return (data ?? []) as NearbyCenterRow[]
}
