// Dashboard figures, counted from the database.
//
// Every number here is real or absent. Nothing is estimated, and nothing falls
// back to a placeholder figure — a tile with no source shows NO_VALUE and the
// gap is written down rather than filled in.
//
// What the database CANNOT answer, and why:
//   plan / subscription tier — no table, column or billing integration stores
//     it. Home and Settings show "Not set" until there is a real source.
import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { DATA_SOURCE } from './transcriptSource';
import { demoTranscripts } from './demoTranscripts';
import { demoCallRecords } from './demoCallRecords';

// Every figure is `| null`, and null means "we do not know" — a query that
// failed, or one that has not run. It is never rendered as 0.
//
// This matters more than it looks: a dashboard that shows 0 sessions because a
// request failed is stating something false with total confidence. Zero appears
// only when the database actually answered zero.
export interface DashboardCounts {
  /** Calls recorded for this business. */
  sessions: number | null;
  /** Total transcribed time, in hours. Null when nothing is transcribed yet. */
  hours: number | null;
  /** Action items still open. Zero until the summary pass runs to create any. */
  actionItemsOpen: number | null;
  /** Calls first seen in the last 7 days. Computed but not currently displayed. */
  callsThisWeek: number | null;
  /** Whether an active WhatsApp number is registered. Null when unknown. */
  whatsappConnected: boolean | null;
  /** Transcripts whose download failed and are waiting on a retry. */
  transcriptsFailed: number | null;
}

export interface DashboardState extends DashboardCounts {
  loading: boolean;
  error: string | null;
  /** True when the business has no calls at all — a brand new account. */
  isEmpty: boolean;
  reload: () => void;
}

/** Nothing known yet. Not "all zero". */
const UNKNOWN: DashboardCounts = {
  sessions: null,
  hours: null,
  actionItemsOpen: null,
  callsThisWeek: null,
  whatsappConnected: null,
  transcriptsFailed: null,
};

/**
 * Counts come back in a response header, so no rows are transferred.
 * Written out per table rather than through one helper: each table has its own
 * columns, and a shared helper would erase that and let a typo through.
 */
const HEAD_COUNT = { count: 'exact' as const, head: true };

function countValue(res: { count: number | null; error: { message: string } | null }): number {
  if (res.error) throw new Error(res.error.message);
  return res.count ?? 0;
}

/** A settled query: its value, or null if it failed. */
function valueOf<T>(settled: PromiseSettledResult<T>): T | null {
  return settled.status === 'fulfilled' ? settled.value : null;
}

function demoCounts(): DashboardCounts {
  const open = demoTranscripts.flatMap((t) => t.actionItems ?? []).filter((a) => !a.completed);
  return {
    ...UNKNOWN,
    sessions: demoCallRecords.length,
    callsThisWeek: demoCallRecords.length,
    actionItemsOpen: open.length,
    whatsappConnected: true,
    // Demo durations are display strings ("42 min"), not numbers, so there is
    // nothing honest to total here.
    hours: null,
  };
}

export function useDashboardStats(): DashboardState {
  const supabase = useSupabase();
  const [counts, setCounts] = useState<DashboardCounts>(
    DATA_SOURCE === 'mock' ? demoCounts() : UNKNOWN
  );
  const [loading, setLoading] = useState(DATA_SOURCE === 'supabase');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (DATA_SOURCE === 'mock') return;
    let cancelled = false;
    setLoading(true);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const runQueries = () =>
      Promise.allSettled([
            supabase.from('calls').select('id', HEAD_COUNT).then(countValue),
            supabase.from('action_items').select('id', HEAD_COUNT).eq('status', 'open').then(countValue),
            // created_at, not started_at: a call created from a transcription
            // webhook has no start time until its lifecycle event arrives.
            supabase.from('calls').select('id', HEAD_COUNT).gte('created_at', weekAgo).then(countValue),
            supabase.from('whatsapp_numbers').select('id', HEAD_COUNT).eq('is_active', true).then(countValue),
            supabase.from('transcripts').select('id', HEAD_COUNT).eq('status', 'failed').then(countValue),
            // TODO(scale): summed in the app because PostgREST aggregate
            // functions are disabled on Supabase (PGRST123), so SUM() is not
            // available over the API. Fine for hundreds of rows; past that this
            // wants a database view or an RPC that returns the total directly.
        supabase
          .from('transcripts')
          .select('duration_seconds')
          .eq('status', 'ready')
          .then((res) => {
            if (res.error) throw new Error(res.error.message);
            return res.data ?? [];
          }),
      ]);

    (async () => {
      let settled = await runQueries();

      // Signing in and loading the dashboard happen almost together, and a
      // request can leave before the session token is attached — one query
      // comes back 401 while its five siblings succeed. Retry once rather than
      // leaving a hole in the dashboard for something that fixes itself.
      if (settled.some((r) => r.status === 'rejected') && !cancelled) {
        await new Promise((r) => setTimeout(r, 1200));
        if (!cancelled) settled = await runQueries();
      }
      if (cancelled) return;

      const [sessions, actionItemsOpen, callsThisWeek, numbers, transcriptsFailed, durations] =
        settled;

      // Each figure stands on its own: one failure no longer blanks the rest.
      const rows = valueOf(durations as PromiseSettledResult<{ duration_seconds: number | null }[]>);
      const numberCount = valueOf(numbers as PromiseSettledResult<number>);

      setCounts({
        sessions: valueOf(sessions as PromiseSettledResult<number>),
        hours:
          rows === null ? null : rows.length === 0 ? null : rows.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / 3600,
        actionItemsOpen: valueOf(actionItemsOpen as PromiseSettledResult<number>),
        callsThisWeek: valueOf(callsThisWeek as PromiseSettledResult<number>),
        whatsappConnected: numberCount === null ? null : numberCount > 0,
        transcriptsFailed: valueOf(transcriptsFailed as PromiseSettledResult<number>),
      });

      const failures = settled.filter((r) => r.status === 'rejected');
      setError(
        failures.length === 0
          ? null
          : `${failures.length} of ${settled.length} dashboard figures could not be loaded`
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce, supabase]);

  return {
    ...counts,
    loading,
    error,
    // Strictly zero. Null means unknown, which is not the same as empty.
    isEmpty: !loading && counts.sessions === 0,
    reload,
  };
}

/**
 * Hours for display, or null when there is nothing to total.
 *
 * Anything under six minutes shows as "<0.1" rather than rounding up to 0.1,
 * which would overstate it: four minutes of calls is not "0.1 hours".
 */
export function formatHours(hours: number | null): string | null {
  if (hours === null) return null;
  if (hours === 0) return '0';
  if (hours < 0.1) return '<0.1';
  return hours >= 10 ? hours.toFixed(0) : hours.toFixed(1);
}
