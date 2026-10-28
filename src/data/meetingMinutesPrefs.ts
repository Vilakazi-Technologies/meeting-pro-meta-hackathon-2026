import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';

export interface MeetingMinutesPrefs {
  enabled: boolean;
  overrideEmail: string | null;
  loading: boolean;
  error: string | null;
}

export function useMeetingMinutesPrefs() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [overrideEmail, setOverrideEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data, error: qErr } = await supabase
      .from('business_members')
      .select('email_minutes_enabled, meeting_minutes_email')
      .eq('clerk_user_id', userId)
      .limit(1)
      .maybeSingle();
    if (qErr) {
      setError(qErr.message);
    } else if (data) {
      setEnabled(data.email_minutes_enabled ?? true);
      setOverrideEmail(data.meeting_minutes_email);
    }
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = async (patch: { enabled?: boolean; overrideEmail?: string | null }) => {
    if (!userId) throw new Error('Not signed in');

    const nextEnabled = patch.enabled ?? enabled;
    const nextEmail =
      patch.overrideEmail !== undefined ? patch.overrideEmail : overrideEmail;

    const { error: upErr } = await supabase
      .from('business_members')
      .update({
        email_minutes_enabled: nextEnabled,
        meeting_minutes_email: nextEmail?.trim() || null,
      })
      .eq('clerk_user_id', userId);
    if (upErr) throw upErr;
    setEnabled(nextEnabled);
    setOverrideEmail(nextEmail?.trim() || null);
  };

  return { enabled, overrideEmail, loading, error, save, reload };
}
