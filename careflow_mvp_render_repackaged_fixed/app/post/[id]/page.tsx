import LikeButton from '@/components/LikeButton';
import CommentSection from '@/components/CommentSection';
import { SectionCard } from '@/components/layout';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = supabase;
  const postRes = client ? await client.from('posts').select('*').eq('id', id).single() : null;
  const imageRes = client ? await client.from('post_images').select('*').eq('post_id', id).order('created_at', { ascending: true }) : null;
  const commentRes = client ? await client.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true }) : null;
  const post = postRes?.data;
  if (!post) return <SectionCard><p>게시글을 찾을 수 없습니다.</p></SectionCard>;
  return <div className="stackLg"><SectionCard><div className="stackMd"><h1>{post.title}</h1><p>{post.content}</p><p className="mutedText">작성자 {post.author_name}</p>{(imageRes?.data || []).map((image) => <img key={image.id} src={image.image_url} alt="게시 이미지" className="postImage" />)}<LikeButton postId={post.id} initialCount={post.like_count ?? 0} /></div></SectionCard><SectionCard><CommentSection postId={post.id} comments={(commentRes?.data || []) as any[]} /></SectionCard></div>;
}
