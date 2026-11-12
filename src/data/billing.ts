// The business's plan and Paystack checkout. my_plan() is computed in Postgres
// from the same function call-control uses to decide whether to transcribe, so
// what the app shows is what the next call will get.
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { useSupabase } from '../contexts/SupabaseContext';
import { DATA_SOURCE } from '../lib/supabaseConfig';

export interface Plan {
  plan: 'free' | 'paid';
  status: 'none' | 'pending' | 'active' | 'non_renewing' | 'attention' | 'cancelled';
  freeLimit: number;
  freeUsed: number;
  periodCallLimit: number;
  periodCallsUsed: number;
  periodMinuteLimit: number;
  periodMinutesUsed: number;
  periodEnd: string | null;
  canTranscribe: boolean;
}

interface PlanRow {
  plan: Plan['plan'];
  status: Plan['status'];
  free_limit: number;
  free_used: number;
  period_call_limit: number;
  period_calls_used: number;
  period_minute_limit: number;
  period_minutes_used: number;
  period_end: string | null;
  can_transcribe: boolean;
}

async function readFunctionError(error: unknown): Promise<string> {
  const context = (error as { context?: Response }).context;
  try {
    const body = await context?.json();
    if (body?.error) return String(body.error);
  } catch {
    /* fall through */
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}

async function openUrl(url: string) {
  if (Platform.OS === 'web') {
    window.location.assign(url);
    return;
  }
  const result = await WebBrowser.openBrowserAsync(url).catch(() => null);
  if (!result) await Linking.openURL(url);
}

export function usePlan() {
  // my_plan and the billing functions post-date the generated Database types.
  const supabase = useSupabase() as unknown as SupabaseClient;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(DATA_SOURCE === 'supabase');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (DATA_SOURCE === 'mock') return;
    let cancelled = false;
    (async () => {
      const { data, error: rpcError } = await supabase.rpc('my_plan').maybeSingle<PlanRow>();
      if (cancelled) return;
      setLoading(false);
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setError(null);
      setPlan(
        data
          ? {
              plan: data.plan,
              status: data.status,
              freeLimit: data.free_limit,
              freeUsed: data.free_used,
              periodCallLimit: data.period_call_limit,
              periodCallsUsed: data.period_calls_used,
              periodMinuteLimit: data.period_minute_limit,
              periodMinutesUsed: data.period_minutes_used,
              periodEnd: data.period_end,
              canTranscribe: data.can_transcribe,
            }
          : null
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, nonce]);

  const subscribe = useCallback(
    async (email: string | null | undefined) => {
      if (!email) {
        setError('Add an email address to your account to subscribe.');
        return;
      }
      setBusy(true);
      setError(null);
      const callbackUrl = Platform.OS === 'web' ? `${window.location.origin}/?billing=return` : undefined;
      const { data, error: fnError } = await supabase.functions.invoke('billing-checkout', {
        body: { email, callback_url: callbackUrl },
      });
      setBusy(false);
      if (fnError || !data?.url) {
        setError(fnError ? await readFunctionError(fnError) : 'Checkout did not start.');
        return;
      }
      await openUrl(data.url);
    },
    [supabase]
  );

  const manage = useCallback(async () => {
    setBusy(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke('billing-manage', { body: {} });
    setBusy(false);
    if (fnError || !data?.url) {
      setError(fnError ? await readFunctionError(fnError) : 'Could not open subscription settings.');
      return;
    }
    await openUrl(data.url);
  }, [supabase]);

  return { plan, loading, busy, error, reload, subscribe, manage };
}
