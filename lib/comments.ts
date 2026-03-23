import { getSupabaseBrowserClient } from '@/lib/supabase';
import { assertIntegerId, validateFreeText } from '@/lib/validators';
import type { Comment } from '@/types/domain';

export async function getCommentsByPost(postId: number) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('comments')
    .select('id,post_id,user_id,content,created_at,profiles(display_name)')
    .eq('post_id', assertIntegerId(postId, '게시글 ID'))
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as unknown as Comment[];
}

export async function createComment(input: { postId: number; userId: string; content: string }) {
  const supabase = getSupabaseBrowserClient();
  const text = validateFreeText(input.content, '댓글', 300);
  if (!text) throw new Error('댓글을 입력해주세요.');

  const { error } = await supabase.from('comments').insert({
    post_id: assertIntegerId(input.postId, '게시글 ID'),
    user_id: input.userId,
    content: text,
  });

  if (error) throw error;
}
