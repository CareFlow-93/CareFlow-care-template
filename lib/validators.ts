import type { UserRole } from '@/types/domain';

const MAX_TEXT_LENGTH = 2000;

export function normalizeText(value?: string | null) {
  return value?.trim() ?? '';
}

export function assertNonEmpty(value: string, fieldName: string) {
  if (!normalizeText(value)) throw new Error(`${fieldName}을(를) 입력해주세요.`);
}

export function assertMaxLength(value: string, maxLength: number, fieldName: string) {
  if (normalizeText(value).length > maxLength) {
    throw new Error(`${fieldName}은(는) ${maxLength}자 이하로 입력해주세요.`);
  }
}

export function assertEmail(value: string) {
  const email = normalizeText(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('올바른 이메일 주소를 입력해주세요.');
  }
  return email;
}

export function assertPassword(value: string) {
  if (value.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
  return value;
}

export function sanitizePhone(value?: string | null) {
  const digits = (value ?? '').replace(/[^0-9+]/g, '');
  return digits || '';
}

export function assertPhone(value: string, required = false) {
  const phone = sanitizePhone(value);
  if (required && !phone) throw new Error('연락처를 입력해주세요.');
  if (phone && phone.length < 9) throw new Error('올바른 연락처를 입력해주세요.');
  return phone;
}

export function assertIntegerId(value: number, fieldName = '식별자') {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`올바른 ${fieldName}가 아닙니다.`);
  }
  return value;
}

export function clampLimit(value: number | undefined, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value as number)));
}

export function assertUrlIfPresent(value?: string | null, fieldName = 'URL') {
  const text = normalizeText(value);
  if (!text) return '';
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('INVALID_PROTOCOL');
    return url.toString();
  } catch {
    throw new Error(`올바른 ${fieldName} 형식이 아닙니다.`);
  }
}

export function sanitizeRoleForProfileUpdate(nextRole: UserRole, currentRole?: UserRole | null) {
  if (currentRole === 'demo_admin') return nextRole;
  if (nextRole === 'demo_admin') throw new Error('운영자 권한은 직접 변경할 수 없습니다.');
  if (currentRole === 'center_admin') return nextRole === 'guardian' ? 'guardian' : 'center_admin';
  return 'guardian';
}

export function validateFreeText(value: string, fieldName: string, maxLength = MAX_TEXT_LENGTH) {
  const text = normalizeText(value);
  assertMaxLength(text, maxLength, fieldName);
  return text;
}
