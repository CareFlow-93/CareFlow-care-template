"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getDeviceKey } from '@/lib/local-auth';

export default function LikeButton({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const client = supabase;
      if (!client) return;
      const deviceKey = getDeviceKey();
      const { data } = await client.from('reactions').select('id').eq('post_id', postId).eq('device_key', deviceKey).eq('reaction_type', 'like').maybeSingle();
      setLiked(Boolean(data));
    }
    load();
  }, [postId]);

  async function toggleLike() {
    const client = supabase;
    if (!client || busy) return;
    setBusy(true);
    const deviceKey = getDeviceKey();
    if (liked) {
      await client.from('reactions').delete().eq('post_id', postId).eq('device_key', deviceKey).eq('reaction_type', 'like');
      setLiked(false);
      setCount((prev) => Math.max(prev - 1, 0));
    } else {
      await client.from('reactions').insert({ post_id: postId, device_key: deviceKey, reaction_type: 'like' });
      setLiked(true);
      setCount((prev) => prev + 1);
    }
    setBusy(false);
  }

  return <button type="button" className={`button ${liked ? '' : 'secondary'}`} onClick={toggleLike}>좋아요 {count}</button>;
}
