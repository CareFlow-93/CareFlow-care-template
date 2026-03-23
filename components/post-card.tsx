'use client';

import { useEffect, useState } from 'react';
import { createComment, getCommentsByPost } from '@/lib/comments';
import { useAuth } from '@/components/auth-provider';
import type { Comment, Post } from '@/types/domain';

export function PostCard({ post }: { post: Post }) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getCommentsByPost(post.id)
      .then((rows) => { if (alive) setComments(rows); })
      .catch(() => { if (alive) setComments([]); });
    return () => { alive = false; };
  }, [post.id]);

  async function handleComment() {
    try {
      setBusy(true);
      setError('');
      if (!profile) throw new Error('로그인 후 댓글 작성이 가능합니다.');
      await createComment({ postId: post.id, userId: profile.id, content });
      const rows = await getCommentsByPost(post.id);
      setComments(rows);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 작성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="postCard stackXs">
      <div className="metaRow between">
        <div className="stackXs">
          <strong>{post.title || post.centers?.name || '센터 생활 기록'}</strong>
          <span className="muted">{post.profiles?.display_name || '기관'} · {new Date(post.created_at).toLocaleString('ko-KR')}</span>
        </div>
        <span className="chip">{post.visibility === 'public' ? '전체 공개' : post.visibility === 'guardians' ? '센터 보호자' : '센터 직원'}</span>
      </div>
      {post.content ? <p className="postContent">{post.content}</p> : null}
      {post.image_url ? <img className="postImage" src={post.image_url} alt="센터 피드 이미지" /> : null}
      <div className="commentBox">
        <div className="sectionTitle compactTitle">
          <h3>댓글</h3>
          <span className="muted">{comments.length}</span>
        </div>
        <div className="commentList">
          {comments.length ? comments.map((comment) => (
            <div key={comment.id} className="commentItem">
              <div className="commentMeta">
                <strong>{comment.profiles?.display_name || '사용자'}</strong>
                <span>{new Date(comment.created_at).toLocaleString('ko-KR')}</span>
              </div>
              <div>{comment.content}</div>
            </div>
          )) : <div className="muted">댓글 없음</div>}
        </div>
        <div className="inlineForm">
          <textarea className="textarea" placeholder={profile ? '댓글을 남겨보세요' : '로그인 후 댓글을 작성할 수 있습니다'} value={content} onChange={(e) => setContent(e.target.value)} disabled={!profile} />
          <button className="ghostBtn iconOnly" onClick={() => void handleComment()} disabled={busy || !profile}>{busy ? '저장 중...' : '댓글 작성'}</button>
          {error ? <div className="error">{error}</div> : null}
        </div>
      </div>
    </article>
  );
}
