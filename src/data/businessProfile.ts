// The signed-in user's business and its WhatsApp number, from the database.
//
// Both queries are scoped by RLS to the businesses the user belongs to, so no
// filter is needed here — and adding one would only hide a policy bug.
//
// Before this existed, the app told every user they were connected, with a
// made-up masked number. Connection status is a fact about the account; it must
// come from the account.
import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { DATA_SOURCE } from './transcriptSource';

export interface WhatsAppNumber {
  displayPhoneNumber: string;
  wabaId: string;
}

export interface BusinessProfile {
  businessName: string | null;
  /** null when no active WhatsApp number is registered for this business. */
  number: WhatsAppNumber | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** "27115550142" -> "+27 11 555 0142" — grouping only, no digits hidden. */
export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;
  const cc = digits.slice(0, 2);
  const rest = digits.slice(2);
  const groups = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5)].filter(Boolean);
  return `+${cc} ${groups.join(' ')}`;
}

export function useBusinessProfile(): BusinessProfile {
  const supabase = useSupabase();
  const [businessName, setBusinessName] = useState<string | null>(
    DATA_SOURCE === 'mock' ? 'Demo Business' : null
  );
  const [number, setNumber] = useState<WhatsAppNumber | null>(
    DATA_SOURCE === 'mock' ? { displayPhoneNumber: '27115550142', wabaId: 'demo' } : null
  );
  const [loading, setLoading] = useState(DATA_SOURCE === 'supabase');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (DATA_SOURCE === 'mock') return;
    let cancelled = false;

    const load = async () => {
      const [business, whatsapp] = await Promise.all([
        supabase.from('businesses').select('name').limit(1).maybeSingle(),
        supabase
          .from('whatsapp_numbers')
          .select('display_phone_number, waba_id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
      ]);
      return { business, whatsapp };
    };

    (async () => {
      try {
        let { business, whatsapp } = await load();
        if (
          !cancelled &&
          !business.error &&
          !whatsapp.error &&
          !business.data &&
          !whatsapp.data
        ) {
          await new Promise((r) => setTimeout(r, 1200));
          if (!cancelled) ({ business, whatsapp } = await load());
        }
        if (cancelled) return;
        if (business.error) throw new Error(business.error.message);
        if (whatsapp.error) throw new Error(whatsapp.error.message);

        setBusinessName(business.data?.name ?? null);
        setNumber(
          whatsapp.data
            ? {
                displayPhoneNumber: whatsapp.data.display_phone_number,
                wabaId: whatsapp.data.waba_id,
              }
            : null
        );
        setError(
          business.data?.name
            ? null
            : 'No business visible — check Clerk↔Supabase link and business_members row.'
        );
      } catch (err) {
        if (cancelled) return;
        setBusinessName(null);
        setNumber(null);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, nonce]);

  return { businessName, number, connected: number !== null, loading, error, reload };
}
