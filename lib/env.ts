export const ENV = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  naverMapClientId: process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? '',
};

export function hasSupabaseEnv() {
  return Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);
}

export function hasNaverMapEnv() {
  return Boolean(ENV.naverMapClientId);
}
