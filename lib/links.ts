import type { Center } from '@/types/domain';

export function sanitizeCenterName(name?: string | null) {
  if (!name) return '';
  return name.replace(/^!+\s*/, '').trim();
}

export function getTelHref(phone?: string | null) {
  if (!phone) return null;
  const sanitized = phone.replace(/[^0-9+]/g, '');
  return sanitized ? `tel:${sanitized}` : null;
}

export function getNaverMapHref(center: Pick<Center, 'name' | 'address' | 'latitude' | 'longitude'>) {
  const cleanName = sanitizeCenterName(center.name);
  const primaryQuery = center.address?.trim() || cleanName || '요양기관';
  const encoded = encodeURIComponent(primaryQuery);
  const base = `https://map.naver.com/p/search/${encoded}`;
  if (typeof center.latitude === 'number' && typeof center.longitude === 'number') return `${base}?c=${center.longitude},${center.latitude},15,0,0,0,dh`;
  return base;
}
