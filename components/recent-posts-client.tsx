'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { getRecentPosts } from '@/lib/posts';
import { PostCard } from '@/components/post-card';
import type { Post } from '@/types/domain';

export function RecentPostsClient() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError('');
        const rows = await getRecentPosts(profile);
        if (active) setPosts(rows);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '피드를 불러오지 못했습니다.');
      }
    }
    void load();
    return () => { active = false; };
  }, [profile?.id, profile?.center_id, profile?.role]);

  return (
    <section className="panel">
      <div className="sectionTitle">
        <div>
          <h2>최근 생활 피드</h2>
          <p className="muted inlineDescription">공개 글을 우선 노출하고, 로그인한 센터 구성원에게는 권한 범위 내 글도 함께 보여줍니다.</p>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}
      <div className="list">
        {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <div className="empty">아직 등록된 공개 피드가 없습니다.</div>}
      </div>
    </section>
  );
}
