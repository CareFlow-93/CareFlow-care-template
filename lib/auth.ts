import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { assertEmail, assertPassword, normalizeText, sanitizePhone } from '@/lib/validators';
import type { Profile, UserRole } from '@/types/domain';

function buildProfilePayload(user: User, fallback?: Partial<Profile>) {
  return {
    id: user.id,
    email: user.email ?? fallback?.email ?? null,
    display_name: (user.user_metadata?.display_name as string | undefined) ?? fallback?.display_name ?? null,
    phone: (user.user_metadata?.phone as string | undefined) ?? fallback?.phone ?? null,
    role: ((user.user_metadata?.role as UserRole | undefined) ?? fallback?.role ?? 'guardian') as UserRole,
    center_id: fallback?.center_id ?? null,
  };
}

export async function getSession() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session as Session | null;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: assertEmail(email),
    password: assertPassword(password),
  });
  if (error) throw error;
  if (data.user) await ensureProfileForUser(data.user);
  return data;
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  role: UserRole;
}) {
  const supabase = getSupabaseBrowserClient();
  const email = assertEmail(input.email);
  const password = assertPassword(input.password);
  const displayName = normalizeText(input.displayName);
  if (!displayName) throw new Error('이름을 입력해주세요.');
  const phone = sanitizePhone(input.phone);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        phone: phone || null,
        role: input.role,
      },
    },
  });

  if (error) throw error;

  if (data.session?.user) {
    await upsertProfile(buildProfilePayload(data.session.user, {
      display_name: displayName,
      phone: phone || null,
      role: input.role,
      email,
    }));
  }

  return data;
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  const supabase = getSupabaseBrowserClient();
  const payload = {
    id: profile.id,
    email: profile.email ?? null,
    role: profile.role ?? 'guardian',
    center_id: profile.center_id ?? null,
    display_name: normalizeText(profile.display_name) || null,
    phone: sanitizePhone(profile.phone) || null,
  };
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role,center_id,display_name,phone,created_at,updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function ensureProfileForUser(user: User) {
  const existing = await getProfile(user.id);
  if (existing) return existing;
  const payload = buildProfilePayload(user);
  await upsertProfile(payload);
  return await getProfile(user.id);
}
