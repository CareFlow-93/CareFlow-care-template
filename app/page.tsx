'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleNearbyClick = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        router.push(
          `/centers?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
        );
      },
      () => {
        alert('위치 정보를 가져오지 못했습니다.');
        setLoading(false);
      }
    );
  };

  return (
    <main className="page">
      <div className="shell stack">
        <section className="hero">
          <h1>CareFlow</h1>
          <p>내 주변 요양센터를 쉽고 빠르게 찾아보세요.</p>

          <button type="button" onClick={handleNearbyClick} disabled={loading}>
            {loading ? '위치 확인 중...' : '내 주변 요양센터 찾기'}
          </button>
        </section>
      </div>
    </main>
  );
}