'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecentPostsClient } from '@/components/recent-posts-client';
import { useAuth } from '@/components/auth-provider';

export default function HomePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleNearby = useCallback(() => {
    if (!profile) {
      const ok = window.confirm('회원가입이 필요합니다. 로그인 / 회원가입 화면으로 이동할까요?');
      if (ok) router.push('/login?intent=nearby');
      return;
    }
    if (!navigator.geolocation) {
      setError('위치 정보를 사용할 수 없는 브라우저입니다.');
      return;
    }
    setBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusy(false);
        router.push(`/centers?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
      },
      () => {
        setBusy(false);
        setError('위치 권한 허용 후 다시 시도해주세요.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, [profile, router]);

  useEffect(() => {
    if (params.get('nearby') === '1' && profile && !busy) handleNearby();
  }, [params, profile, busy, handleNearby]);

  return (
    <main className="page">
      <div className="shell stack">
        <section className="landingCard landingHeroSolo">
          <div className="careflowLogoWrap" aria-hidden="true">
            <div className="careflowLogoOrbit" />
            <div className="careflowLogoPulse" />
            <div className="careflowLogoWord">CareFlow</div>
          </div>
          <button className="primaryBtn megaBtn" onClick={handleNearby} disabled={busy}>
            {busy ? '위치 확인 중...' : '내 주변 요양센터 찾기'}
          </button>
          {error ? <div className="error">{error}</div> : null}
        </section>
        <RecentPostsClient />
      </div>
    </main>
  );
}
