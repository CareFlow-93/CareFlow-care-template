import { Suspense } from 'react';
import CentersBrowser from '@/components/centers-browser';

export const dynamic = 'force-dynamic';

function CentersPageFallback() {
  return (
    <main className="page">
      <div className="shell">
        <section className="hero heroCompact">
          <div className="chipRow">
            <span className="chip">센터 불러오는 중</span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CentersPage() {
  return (
    <main className="page">
      <div className="shell">
        <Suspense fallback={<CentersPageFallback />}>
          <CentersBrowser />
        </Suspense>
      </div>
    </main>
  );
}
