import Link from 'next/link';
import { Card } from '@/components/layout';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!supabase) {
    return (
      <Card>
        <p>Supabase 연결이 설정되지 않았습니다.</p>
      </Card>
    );
  }

  const [centerRes, postsRes] = await Promise.all([
    supabase.from('centers').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('posts')
      .select('id,title,content,like_count,comment_count,created_at')
      .eq('center_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const center = centerRes?.data;
  const posts = postsRes?.data || [];

  if (!center) {
    return (
      <Card>
        <p>센터를 찾을 수 없습니다.</p>
      </Card>
    );
  }

  return (
    <div className="stackLg">
      <Card>
        <div className="stackSm">
          <h1>{center.name}</h1>
          <p>{center.address}</p>

          <div className="detailGrid">
            <div><span>기관코드</span><strong>{center.source_org_code || '-'}</strong></div>
            <div><span>기관유형</span><strong>{center.type_name || '-'}</strong></div>
            <div><span>정원</span><strong>{center.capacity_total ?? '-'}</strong></div>
            <div><span>현원</span><strong>{center.capacity_current ?? '-'}</strong></div>
            <div><span>평가등급</span><strong>{center.rating_grade || '-'}</strong></div>
            <div><span>평가점수</span><strong>{center.rating_total_score ?? '-'}</strong></div>
            <div><span>사회복지사</span><strong>{center.staff_social_worker ?? '-'}</strong></div>
            <div><span>요양보호사</span><strong>{center.staff_caregiver ?? '-'}</strong></div>
          </div>

          <div className="row">
            <Link href={`/centers/${id}/write`} className="button">
              기록 작성
            </Link>
            <Link href={`/manager?centerId=${id}`} className="button secondary">
              관리자 인증 요청
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <div className="stackMd">
          <h2>센터 기록 피드</h2>
          <div className="stackSm">
            {posts.length === 0 ? (
              <p className="mutedText">기록이 없습니다.</p>
            ) : null}

            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="card insetCard linkBlock"
              >
                <strong>{post.title}</strong>
                <p>{post.content}</p>
                <span className="mutedText">
                  좋아요 {post.like_count} · 댓글 {post.comment_count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}