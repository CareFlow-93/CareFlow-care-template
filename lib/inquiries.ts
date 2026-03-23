import { getSupabaseBrowserClient } from '@/lib/supabase';
import { assertEmail, assertPhone, normalizeText, validateFreeText } from '@/lib/validators';

export async function createInquiry(input: { name?: string; organization?: string; role?: string; phone?: string; email?: string; message: string }) {
  const supabase = getSupabaseBrowserClient();
  const message = validateFreeText(input.message, '문의 내용', 2000);
  if (!message) throw new Error('문의 내용을 입력해주세요.');

  const { error } = await supabase.from('inquiries').insert({
    name: normalizeText(input.name) || null,
    organization: normalizeText(input.organization) || null,
    role_text: validateFreeText(input.role ?? '', '직책', 80) || null,
    phone: input.phone ? assertPhone(input.phone, false) || null : null,
    email: input.email ? assertEmail(input.email) : null,
    message,
  });
  if (error) throw error;
}
