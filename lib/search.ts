import type { SupabaseClient } from '@supabase/supabase-js'
import type { CenterFilters } from '@/lib/centers'

export async function searchCenters(
  supabase: SupabaseClient,
  filters: Partial<CenterFilters>
) {
  let query = supabase.from('centers').select('*')

  if (filters.typeName) query = query.eq('type_name', filters.typeName)
  if (filters.keyword) query = query.ilike('name', `%${filters.keyword}%`)

  return await query.limit(200)
}
