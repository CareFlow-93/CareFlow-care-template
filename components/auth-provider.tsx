'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { ensureProfileForUser, getProfile, getSession, signIn, signOut, signUp, upsertProfile } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { sanitizeRoleForProfileUpdate } from '@/lib/validators';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/domain';

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  authUser: User | null;
  profile: Profile | null;
  error: string;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: { email: string; password: string; displayName: string; phone?: string; role: UserRole }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (patch: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  async function refreshProfile(userId?: string) {
    const targetUserId = userId ?? authUser?.id;
    if (!targetUserId) {
      setProfile(null);
      return;
    }
    try {
      const next = await getProfile(targetUserId);
      setProfile(next);
    } catch (err) {
      setError(getErrorMessage(err, '프로필을 불러오지 못했습니다.'));
    }
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        setError('');
        const currentSession = await getSession();
        if (!mounted) return;
        setSession(currentSession);
        setAuthUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await ensureProfileForUser(currentSession.user);
          if (!mounted) return;
          const profileRow = await getProfile(currentSession.user.id);
          if (!mounted) return;
          setProfile(profileRow);
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, '인증 초기화에 실패했습니다.'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        ensureProfileForUser(nextSession.user)
          .then(() => getProfile(nextSession.user.id))
          .then((profileRow) => setProfile(profileRow))
          .catch((err) => setError(getErrorMessage(err, '프로필 동기화에 실패했습니다.')));
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string, password: string) {
    setError('');
    await signIn(email, password);
  }

  async function signUpWithEmail(input: { email: string; password: string; displayName: string; phone?: string; role: UserRole }) {
    setError('');
    const result = await signUp(input);
    return { needsEmailConfirmation: !result.session };
  }

  async function signOutUser() {
    setError('');
    await signOut();
    setProfile(null);
  }

  async function saveProfile(patch: Partial<Profile>) {
    if (!authUser) throw new Error('로그인 후 이용해주세요.');
    const currentRole = profile?.role ?? 'guardian';
    await upsertProfile({
      id: authUser.id,
      email: authUser.email ?? profile?.email ?? null,
      role: sanitizeRoleForProfileUpdate(patch.role ?? currentRole, currentRole),
      center_id: patch.center_id ?? profile?.center_id ?? null,
      display_name: patch.display_name ?? profile?.display_name ?? null,
      phone: patch.phone ?? profile?.phone ?? null,
    });
    await refreshProfile(authUser.id);
  }

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    session,
    authUser,
    profile,
    error,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    refreshProfile: () => refreshProfile(),
    saveProfile,
  }), [loading, session, authUser, profile, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  return value;
}
