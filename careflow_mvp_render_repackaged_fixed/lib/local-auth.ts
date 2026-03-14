export type LocalRole = 'developer' | 'manager' | 'staff' | 'user';
export type LocalUser = { id: string; name: string; role: LocalRole };

const AUTH_KEY = 'careflow-local-user';
const DEVICE_KEY = 'careflow-device-key';

export const DEVELOPER_USER: LocalUser = {
  id: '00000000-0000-0000-0000-000000000001',
  name: '방민',
  role: 'developer',
};

function hasWindow() { return typeof window !== 'undefined'; }

export function loginDeveloper(id: string, password: string) {
  if (id !== '방민' || password !== 'als53794207!') {
    return { ok: false as const, message: '아이디 또는 비밀번호가 맞지 않습니다.' };
  }
  if (hasWindow()) window.localStorage.setItem(AUTH_KEY, JSON.stringify(DEVELOPER_USER));
  return { ok: true as const, user: DEVELOPER_USER };
}

export function getCurrentUser(): LocalUser | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LocalUser; } catch { return null; }
}

export function logoutCurrentUser() {
  if (hasWindow()) window.localStorage.removeItem(AUTH_KEY);
}

export function getDeviceKey() {
  if (!hasWindow()) return 'server-device';
  const found = window.localStorage.getItem(DEVICE_KEY);
  if (found) return found;
  const next = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, next);
  return next;
}
