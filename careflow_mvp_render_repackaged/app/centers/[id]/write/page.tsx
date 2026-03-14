"use client";

import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SectionCard } from '@/components/layout';
import { getCurrentUser } from '@/lib/local-auth';
import { supabase } from '@/lib/supabase';

export default function WritePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const client = supabase;
    if (!client) return;
    const user = getCurrentUser();
    const centerId = params.id;
    if (!user) { setError('로그인 후 기록을 작성하세요.'); return; }
    const { data: post, error: postError } = await client.from('posts').insert({ center_id: centerId, author_id: user.id, author_name: user.name, author_role: user.role, title, content, type: 'general', visibility: 'public' }).select('id').single();
    if (postError || !post) { setError(postError?.message || '기록 저장 실패'); return; }
    for (const file of Array.from(files || []).slice(0, 5)) {
      const path = `${post.id}/${Date.now()}-${file.name}`;
      const upload = await client.storage.from('post-images').upload(path, file, { upsert: false });
      if (!upload.error) {
        const { data } = client.storage.from('post-images').getPublicUrl(path);
        await client.from('post_images').insert({ post_id: post.id, image_url: data.publicUrl });
      }
    }
    router.push(`/centers/${centerId}`);
    router.refresh();
  }

  return <SectionCard><form className="stackMd" onSubmit={onSubmit}><h1>기록 작성</h1><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" /><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="내용" /><input type="file" accept="image/*" capture="environment" multiple onChange={(e) => setFiles(e.target.files)} />{error ? <p className="errorText">{error}</p> : null}<button className="button" type="submit">저장</button></form></SectionCard>;
}
