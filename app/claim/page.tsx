import { Suspense } from 'react';
import { ClaimForm } from '@/components/claim-form';

export const dynamic = 'force-dynamic';

function ClaimPageFallback() {
  return <section className="panel">불러오는 중...</section>;
}

export default function ClaimPage() {
  return (
    <main className="page">
      <div className="shell stack">
        <section className="hero heroCompact">
          <h1>소속 센터 등록하기</h1>
          <p>센터 관리자 또는 관계자 계정을 센터와 연결하는 신청 화면입니다.</p>
        </section>
        <Suspense fallback={<ClaimPageFallback />}><ClaimForm /></Suspense>
      </div>
    </main>
  );
}
