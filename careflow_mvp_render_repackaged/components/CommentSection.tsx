"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/local-auth';

type CommentRow = { id: string; author_name: string; content: string; created_at: string; };

export default function CommentSection({ postId, comments }: { postId: string; comments: CommentRow[] }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const client = supabase;
    if (!client) return;
    const user = getCurrentUser();
    if (!user) { setError('로그인 후 댓글을 작성하세요.'); return; }
    await client.from('comments').insert({ post_id: postId, author_name: user.name, content });
    router.refresh();
  }

  return (
    <div className="stackMd">
      <h2>댓글</h2>
      <form className="stackSm" onSubmit={onSubmit}>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="댓글 작성" />
        {error ? <p className="errorText">{error}</p> : null}
        <button className="button" type="submit">댓글 등록</button>
      </form>
      <div className="stackSm">
        {comments.map((comment) => <div className="card insetCard" key={comment.id}><strong>{comment.author_name}</strong><p>{comment.content}</p></div>)}
      </div>
    </div>
  );
}
