// Call history for the Calls screen, read from the calls table.
//
// A call and its transcript are separate things: the call always exists, the
// transcript may be on its way, may have failed, or may never come. This screen
// is the only place that shows the call itself, so it has to be honest about
// which of those is true.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { DATA_SOURCE } from './transcriptSource';
import { demoCallRecords } from './demoCallRecords';

export type CallTranscriptState = 'ready' | 'failed' | 'waiting';

export interface CallRecord {
  id: string;
  /** The other party's number, already formatted for display. */
  counterparty: string | null;
  direction: 'business_initiated' | 'user_initiated' | 'unknown';
  startedAt: string | null;
  durationSeconds: number | null;
  /** Meta's own outcome for the call, e.g. COMPLETED. */
  status: string | null;
  transcriptId: string | null;
  transcriptTitle: string | null;
  transcriptState: CallTranscriptState;
}

export interface CallHistoryState {
  calls: CallRecord[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface DbTranscript {
  id: string;
  title: string | null;
  status: string;
}

interface DbCallRow {
  id: string;
  direction: string;
  counterparty_phone: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  status: string | null;
  // PostgREST returns an object for a to-one embed and an array otherwise.
  transcripts: DbTranscript | DbTranscript[] | null;
}

function firstTranscript(value: DbCallRow['transcripts']): DbTranscript | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function formatCallDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return secs === 0 ? `${mins} min` : `${mins} min ${secs}s`;
}

export function formatCallNumber(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;
  const cc = digits.slice(0, 2);
  const rest = digits.slice(2);
  return `+${cc} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
}

function mapRows(data: DbCallRow[]): CallRecord[] {
  return data.map((row) => {
    const transcript = firstTranscript(row.transcripts);
    return {
      id: row.id,
      counterparty: formatCallNumber(row.counterparty_phone),
      direction: (row.direction as CallRecord['direction']) ?? 'unknown',
      startedAt: row.started_at,
      durationSeconds: row.duration_seconds,
      status: row.status,
      transcriptId: transcript?.id ?? null,
      transcriptTitle: transcript?.title ?? null,
      transcriptState:
        transcript === null
          ? 'waiting'
          : transcript.status === 'ready'
            ? 'ready'
            : transcript.status === 'failed'
              ? 'failed'
              : 'waiting',
    };
  });
}

async function fetchCallHistory(
  supabase: SupabaseClient<Database>
): Promise<{ calls: CallRecord[]; error: string | null }> {
  const { data, error: err } = await supabase
    .from('calls')
    .select(
      'id, direction, counterparty_phone, started_at, duration_seconds, status, transcripts(id, title, status)'
    )
    .order('started_at', { ascending: false, nullsFirst: false })
    .limit(50);

  if (err) return { calls: [], error: err.message };
  return {
    calls: mapRows((data ?? []) as unknown as DbCallRow[]),
    error: null,
  };
}

export function useCallHistory(): CallHistoryState {
  const supabase = useSupabase();
  /** Unique per hook instance — Home + Contacts both call useCallHistory; shared channel names crash realtime. */
  const channelScope = useRef(`ch-${Math.random().toString(36).slice(2, 11)}`);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(DATA_SOURCE === 'supabase');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (DATA_SOURCE === 'mock') {
      setCalls(demoCallRecords);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      const result = await fetchCallHistory(supabase);
      if (cancelled) return;
      setError(result.error);
      setCalls(result.calls);
      setLoading(false);
    };

    load(true);

    const onDbChange = () => {
      load(false);
    };

    // One postgres_changes listener per channel — chaining .on() before .subscribe() throws
    // "cannot add postgres_changes callbacks after subscribe()" in current realtime-js.
    const scope = channelScope.current;
    const callsChannel = supabase
      .channel(`meeting-pro-calls-${scope}-${nonce}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, onDbChange)
      .subscribe();

    const transcriptsChannel = supabase
      .channel(`meeting-pro-calls-transcripts-${scope}-${nonce}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transcripts' }, onDbChange)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(callsChannel);
      supabase.removeChannel(transcriptsChannel);
    };
  }, [nonce, supabase]);

  return { calls, loading, error, reload };
}
