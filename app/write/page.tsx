import { Suspense } from 'react';
import { WriteForm } from '@/components/write-form';

export const dynamic = 'force-dynamic';

function WritePageInner() {
  return (
    <main className="page">
      <div className="shell stack">
        <section className="hero heroCompact">
          <h1>우리 센터 활동 알리기</h1>
          <p>사진과 제목, 짧은 설명만으로 센터 활동을 빠르게 올리는 입력 화면입니다.</p>
        </section>
        <WriteForm />
      </div>
    </main>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<main className="page"><div className="shell">불러오는 중...</div></main>}>
      <WritePageInner />
    </Suspense>
  );
}
