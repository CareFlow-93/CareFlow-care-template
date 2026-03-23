import CenterDetailClient from '@/components/center-detail-client';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function CenterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('id', Number(params.id))
    .single();

  if (error || !data) {
    return (
      <main className="page">
        <div className="shell">
          <section className="hero heroCompact">
            <div className="stackXs">
              <span className="chip">센터 상세 조회 실패</span>
              <p>{error?.message ?? '센터 정보를 찾을 수 없습니다.'}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <CenterDetailClient center={data} />
      </div>
    </main>
  );
}
