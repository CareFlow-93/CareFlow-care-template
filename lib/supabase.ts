import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV, hasSupabaseEnv } from '@/lib/env';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    throw new Error('Supabase 환경변수가 비어 있습니다. Render의 Environment에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 다시 확인하세요.');
  }

  if (!browserClient) {
    browserClient = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
