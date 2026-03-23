import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV, hasSupabaseEnv } from '@/lib/env';

export function getSupabaseServerClient(): SupabaseClient {
  if (!hasSupabaseEnv()) {
    throw new Error(
      'Supabase 환경변수가 비어 있습니다. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.'
    );
  }

  return createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
