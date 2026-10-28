import { useCallback, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { DATA_SOURCE } from '../lib/supabaseConfig';

export type RegisterWhatsAppInput = {
  displayPhone: string;
  phoneNumberId: string;
  wabaId: string;
  businessName?: string;
};

export type RegisterWhatsAppResult =
  | { ok: true; numberId: string }
  | { ok: false; message: string };

export async function registerWhatsAppNumber(
  supabase: ReturnType<typeof useSupabase>,
  input: RegisterWhatsAppInput
): Promise<RegisterWhatsAppResult> {
  const { data, error } = await supabase.rpc('register_whatsapp_number', {
    p_display_phone: input.displayPhone.trim(),
    p_phone_number_id: input.phoneNumberId.trim(),
    p_waba_id: input.wabaId.trim(),
    p_business_name: input.businessName?.trim() || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: 'Registration did not return an id.' };
  }
  return { ok: true, numberId: String(data) };
}

export function useRegisterWhatsAppNumber() {
  const supabase = useSupabase();
  const [submitting, setSubmitting] = useState(false);

  const register = useCallback(
    async (input: RegisterWhatsAppInput): Promise<RegisterWhatsAppResult> => {
      if (DATA_SOURCE === 'mock') {
        return { ok: true, numberId: 'demo' };
      }
      setSubmitting(true);
      try {
        return await registerWhatsAppNumber(supabase, input);
      } finally {
        setSubmitting(false);
      }
    },
    [supabase]
  );

  return { register, submitting };
}
