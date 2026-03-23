import { getSupabaseBrowserClient } from '@/lib/supabase';
import { assertIntegerId, normalizeText, validateFreeText } from '@/lib/validators';
import type { Claim, ClaimStatus, Profile } from '@/types/domain';

export async function createClaim(input: { userId: string; centerId: number; message?: string }) {
  const supabase = getSupabaseBrowserClient();
  const centerId = assertIntegerId(input.centerId, '센터 ID');
  const message = validateFreeText(input.message ?? '', '신청 메시지', 500) || null;

  const { data: existing, error: existingError } = await supabase
    .from('claims')
    .select('id,status')
    .eq('center_id', centerId)
    .eq('user_id', input.userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.id) throw new Error('이미 해당 센터에 대한 Claim 요청이 접수되어 있습니다.');

  const { error } = await supabase.from('claims').insert({
    center_id: centerId,
    user_id: input.userId,
    message,
  });

  if (error) throw error;
}

export async function getOwnClaims(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('claims')
    .select('id,center_id,user_id,message,status,created_at,centers(id,name,region_text)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Claim[];
}

export async function getPendingClaims(viewer: Pick<Profile, 'id' | 'role' | 'center_id'>) {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from('claims')
    .select('id,center_id,user_id,message,status,created_at,centers(id,name,region_text),profiles(id,display_name,email,phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (viewer.role === 'center_admin' && viewer.center_id) {
    query = query.eq('center_id', viewer.center_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Claim[];
}

export async function reviewClaim(input: { claimId: number; status: ClaimStatus; reviewer: Pick<Profile, 'role'> }) {
  if (input.reviewer.role !== 'demo_admin') {
    throw new Error('Claim 승인/거절은 운영자 계정만 가능합니다.');
  }

  const supabase = getSupabaseBrowserClient();
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('id,center_id,user_id,status')
    .eq('id', assertIntegerId(input.claimId, 'Claim ID'))
    .single();

  if (claimError) throw claimError;
  if (!claim) throw new Error('해당 신청을 찾을 수 없습니다.');
  if (normalizeText(claim.status) !== 'pending') throw new Error('이미 처리된 신청입니다.');

  const { error } = await supabase.from('claims').update({ status: input.status }).eq('id', input.claimId);
  if (error) throw error;

  if (input.status === 'approved') {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ center_id: claim.center_id, role: 'center_admin' })
      .eq('id', claim.user_id);
    if (profileError) throw profileError;
  }
}
