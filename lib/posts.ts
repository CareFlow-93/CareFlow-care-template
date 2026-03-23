import { getSupabaseBrowserClient } from '@/lib/supabase';
import { assertIntegerId, normalizeText, validateFreeText } from '@/lib/validators';
import type { Post, PostVisibility, Profile } from '@/types/domain';

function canViewPost(post: Pick<Post, 'center_id' | 'visibility'>, viewer?: Pick<Profile, 'role' | 'center_id'> | null) {
  if (post.visibility === 'public') return true;
  if (!viewer || viewer.center_id !== post.center_id) return false;
  if (post.visibility === 'guardians') return true;
  return viewer.role === 'center_admin' || viewer.role === 'demo_admin';
}

export async function getPostsByCenter(centerId: number, viewer?: Pick<Profile, 'role' | 'center_id'> | null) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('posts')
    .select('id,center_id,author_id,title,content,image_url,visibility,created_at,centers(id,name,region_text),profiles(id,display_name,role)')
    .eq('center_id', assertIntegerId(centerId, '센터 ID'))
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return ((data ?? []) as unknown as Post[]).filter((post) => canViewPost(post, viewer));
}

export async function getRecentPosts(viewer?: Pick<Profile, 'role' | 'center_id'> | null) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('posts')
    .select('id,center_id,author_id,title,content,image_url,visibility,created_at,centers(id,name,region_text),profiles(id,display_name,role)')
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) throw error;
  return ((data ?? []) as unknown as Post[]).filter((post) => canViewPost(post, viewer));
}

export async function uploadPostImage(file: File, centerId: number, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const maxBytes = 5 * 1024 * 1024;
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있습니다.');
  if (file.size > maxBytes) throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `center-${assertIntegerId(centerId, '센터 ID')}/user-${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('post-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function createPost(input: {
  userId: string;
  centerId: number;
  title?: string;
  content: string;
  imageUrl?: string | null;
  visibility: PostVisibility;
}) {
  const supabase = getSupabaseBrowserClient();
  const title = validateFreeText(input.title ?? '', '제목', 120) || null;
  const content = validateFreeText(input.content, '내용', 2000) || null;
  const imageUrl = normalizeText(input.imageUrl) || null;

  if (!content && !imageUrl && !title) {
    throw new Error('제목, 사진, 내용 중 하나는 입력해주세요.');
  }

  const { error } = await supabase.from('posts').insert({
    center_id: assertIntegerId(input.centerId, '센터 ID'),
    author_id: input.userId,
    title,
    content,
    image_url: imageUrl,
    visibility: input.visibility,
  });

  if (error) throw error;
}
