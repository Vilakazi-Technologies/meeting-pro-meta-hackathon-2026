import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';

export interface BusinessContact {
  id: string;
  displayName: string;
  phone: string;
  email: string | null;
  company: string | null;
  notes: string | null;
}

function mapRow(row: {
  id: string;
  display_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  notes: string | null;
}): BusinessContact {
  return {
    id: row.id,
    displayName: row.display_name,
    phone: row.phone,
    email: row.email,
    company: row.company,
    notes: row.notes,
  };
}

export function useBusinessContacts() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const [contacts, setContacts] = useState<BusinessContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from('business_contacts')
      .select('id, display_name, phone, email, company, notes')
      .order('display_name', { ascending: true });
    if (qErr) {
      setError(qErr.message);
      setContacts([]);
    } else {
      setContacts((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addContact = async (input: {
    displayName: string;
    phone: string;
    email?: string;
    company?: string;
    notes?: string;
  }) => {
    if (!userId) throw new Error('Not signed in');
    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('clerk_user_id', userId)
      .limit(1)
      .maybeSingle();
    if (!membership?.business_id) throw new Error('No business membership');

    const { error: insErr } = await supabase.from('business_contacts').insert({
      business_id: membership.business_id,
      display_name: input.displayName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      company: input.company?.trim() || null,
      notes: input.notes?.trim() || null,
    });
    if (insErr) throw insErr;
    await reload();
  };

  const removeContact = async (id: string) => {
    const { error: delErr } = await supabase.from('business_contacts').delete().eq('id', id);
    if (delErr) throw delErr;
    await reload();
  };

  return { contacts, loading, error, reload, addContact, removeContact };
}
