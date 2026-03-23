import { getSupabaseBrowserClient } from '@/lib/supabase';
import { assertIntegerId, assertPhone, normalizeText, validateFreeText } from '@/lib/validators';
import type { ConsultationRequest, ConsultationStatus } from '@/types/domain';

export async function createConsultationRequest(input: {
  centerId: number;
  guardianName: string;
  phone: string;
  patientRelation?: string;
  message?: string;
}) {
  const supabase = getSupabaseBrowserClient();
  const guardianName = normalizeText(input.guardianName);
  if (!guardianName) throw new Error('보호자 이름을 입력해주세요.');
  const phone = assertPhone(input.phone, true);

  const { error } = await supabase.from('consultation_requests').insert({
    center_id: assertIntegerId(input.centerId, '센터 ID'),
    guardian_name: guardianName,
    phone,
    patient_relation: validateFreeText(input.patientRelation ?? '', '어르신과의 관계', 50) || null,
    message: validateFreeText(input.message ?? '', '상담 내용', 1000) || null,
    status: 'pending',
  });

  if (error) throw error;
}

export async function getConsultationRequestsByCenter(centerId: number) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('consultation_requests')
    .select('id,center_id,guardian_name,phone,patient_relation,message,status,created_at')
    .eq('center_id', assertIntegerId(centerId, '센터 ID'))
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as ConsultationRequest[];
}

export async function updateConsultationStatus(id: number, status: ConsultationStatus) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('consultation_requests')
    .update({ status })
    .eq('id', assertIntegerId(id, '상담 요청 ID'));

  if (error) throw error;
}
