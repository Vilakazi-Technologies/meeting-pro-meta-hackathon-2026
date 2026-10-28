// Where the transcript screens get their data.
//
// Two sources behind one interface, selected by EXPO_PUBLIC_DATA_SOURCE:
//   supabase (default) — real rows from the database, as the signed-in user
//   mock               — src/data/demoTranscripts.ts, for side-by-side comparison
//
// Demo data is never imported by a screen: it reaches the UI only through this
// module, and only when demo mode is switched on.
//
// The database schema and the UI types in src/types were designed separately and
// do not line up. Neither is reshaped here. The adapter below maps one onto the
// other and every mapping that has to make a choice is marked MISMATCH, so the
// open decisions stay visible rather than disappearing into the code.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { getActiveSupabaseClient } from '../lib/supabaseRef';
import type { Database } from '../lib/database.types';
import { SPEAKER_COLORS } from '../constants/theme';
import * as demo from './demoTranscripts';
import type {
  ActionItem,
  Speaker,
  Transcript,
  TranscriptSegment,
  TranscriptStatus,
} from '../types';

export type DataSource = 'supabase' | 'mock';

export const DATA_SOURCE: DataSource =
  process.env.EXPO_PUBLIC_DATA_SOURCE === 'mock' ? 'mock' : 'supabase';

type DbTranscriptStatus = Database['public']['Enums']['transcript_status'];
type DbActionStatus = Database['public']['Enums']['action_item_status'];
type DbSummaryStatus = Database['public']['Enums']['summary_status'];

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
// One round trip each, joined through the foreign keys. RLS scopes every table
// to the signed-in user's business, so no business filter is needed here — and
// adding one would only hide a policy bug rather than reveal it.

const LIST_SELECT = `
  id, status, created_at, duration_seconds, summary, title, summary_status,
  calls ( started_at, duration_seconds, counterparty_phone, direction ),
  transcript_tags ( tags ( name ) ),
  action_items ( id, text, owner, status )
` as const;

const DETAIL_SELECT = `
  id, status, created_at, duration_seconds, summary, title, summary_status,
  calls ( started_at, duration_seconds, counterparty_phone, direction ),
  transcript_tags ( tags ( name ) ),
  action_items ( id, text, owner, status ),
  transcript_segments ( id, segment_index, speaker, channel, start_seconds, text )
` as const;

interface DbCall {
  started_at: string | null;
  duration_seconds: number | null;
  counterparty_phone: string | null;
  direction: string;
}

interface DbRow {
  id: string;
  title: string | null;
  status: DbTranscriptStatus;
  created_at: string;
  duration_seconds: number | null;
  summary: string | null;
  summary_status: DbSummaryStatus;
  calls: DbCall | null;
  transcript_tags: { tags: { name: string } | null }[];
  action_items: { id: string; text: string; owner: string | null; status: DbActionStatus }[];
  transcript_segments?: {
    id: string;
    segment_index: number;
    speaker: string | null;
    channel: number | null;
    start_seconds: number | null;
    text: string | null;
  }[];
}

// ---------------------------------------------------------------------------
// Adapter: database row -> UI Transcript
// ---------------------------------------------------------------------------

// The database has four pipeline states and the UI four display states.
// pending and fetching both read as "processing". `failed` is shown as failed,
// with a retry — never hidden. `live` exists only in the UI.
function mapStatus(status: DbTranscriptStatus): TranscriptStatus {
  if (status === 'ready') return 'completed';
  if (status === 'failed') return 'failed';
  return 'processing';
}

// MISMATCH: the UI shows duration as a display string ("42 min"); the database
// stores seconds. Formatted to match the mock's style.
function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

// UI segment timestamps are "HH:MM:SS" strings; the database stores seconds.
function formatTimestamp(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '--:--:--';
  const s = Math.floor(seconds);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// The real title is written by the summary pass. Until that has run — or if it
// failed — fall back to a label derived from the call, which is honest about
// being a label rather than a description of the conversation.
function titleFor(row: DbRow): string {
  const title = row.title?.trim();
  if (title) return title;
  return row.calls?.counterparty_phone
    ? `WhatsApp call · +${row.calls.counterparty_phone}`
    : 'WhatsApp call';
}

// MISMATCH: UI participants are display names. The database holds only the
// counterparty's phone number and business-scoped user id — no names for either
// side. The phone number is the closest available stand-in.
function deriveParticipants(call: DbCall | null): string[] {
  return call?.counterparty_phone ? [`+${call.counterparty_phone}`] : [];
}

// MISMATCH: UI action items have a boolean `completed`; the database has three
// states. `cancelled` is neither done nor open, so cancelled items are omitted
// rather than shown as either. `owner` maps to `assignee`; `due_date` and
// `is_ai_generated` have no UI field and are dropped.
function mapActionItems(rows: DbRow['action_items']): ActionItem[] {
  return rows
    .filter((a) => a.status !== 'cancelled')
    .map((a) => ({
      id: a.id,
      text: a.text,
      assignee: a.owner ?? undefined,
      completed: a.status === 'done',
    }));
}

// MISMATCH: UI segments point at a global speaker list by `speakerId`, with a
// name and colour per person. The database has no speakers table — Meta
// separates speakers by audio channel only (0 = business, 1 = customer). Each
// channel becomes a synthetic speaker, named from the segment's own `speaker`
// label and coloured by channel.
function channelSpeakerId(channel: number | null): string {
  return channel === null ? 'channel-unknown' : `channel-${channel}`;
}

function mapSegments(rows: NonNullable<DbRow['transcript_segments']>): {
  segments: TranscriptSegment[];
  speakers: Speaker[];
} {
  const ordered = [...rows].sort((a, b) => a.segment_index - b.segment_index);
  const speakers = new Map<string, Speaker>();
  const segments = ordered.map((seg) => {
    const speakerId = channelSpeakerId(seg.channel);
    if (!speakers.has(speakerId)) {
      speakers.set(speakerId, {
        id: speakerId,
        name: seg.speaker ?? 'Unknown speaker',
        color: SPEAKER_COLORS[(seg.channel ?? 0) % SPEAKER_COLORS.length],
      });
    }
    return {
      id: seg.id,
      speakerId,
      text: seg.text ?? '',
      timestamp: formatTimestamp(seg.start_seconds),
    };
  });
  return { segments, speakers: [...speakers.values()] };
}

function toTranscript(row: DbRow): { transcript: Transcript; speakers: Speaker[] } {
  const call = row.calls;
  const mapped = row.transcript_segments ? mapSegments(row.transcript_segments) : null;
  return {
    transcript: {
      id: row.id,
      title: titleFor(row),
      // MISMATCH: the UI distinguishes four sources; everything in the database
      // arrives through the calls webhook, so it is always a WhatsApp call. Voice
      // notes, meetings and uploads have no ingest path yet.
      source: 'whatsapp_call',
      status: mapStatus(row.status),
      date: call?.started_at ?? row.created_at,
      duration: formatDuration(row.duration_seconds ?? call?.duration_seconds ?? null),
      participants: deriveParticipants(call),
      tags: row.transcript_tags
        .map((tt) => tt.tags?.name)
        .filter((n): n is string => Boolean(n)),
      summary: row.summary ?? undefined,
      // 'ready' with no text would be a contradiction; treat it as not run.
      summaryStatus: row.summary_status === 'ready' && !row.summary
        ? 'pending'
        : row.summary_status,
      actionItems: mapActionItems(row.action_items),
      segments: mapped?.segments,
      // MISMATCH: keywordMatches is a search-time figure; nothing stores it.
      keywordMatches: undefined,
    },
    speakers: mapped?.speakers ?? [],
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

interface ListState {
  transcripts: Transcript[];
  loading: boolean;
  error: string | null;
  source: DataSource;
  reload: () => void;
}

export function useTranscripts(): ListState {
  const supabase = useSupabase();
  const listChannelScope = useRef(`tr-${Math.random().toString(36).slice(2, 11)}`);
  const [transcripts, setTranscripts] = useState<Transcript[]>(
    DATA_SOURCE === 'mock' ? demo.demoTranscripts : []
  );
  const [loading, setLoading] = useState(DATA_SOURCE === 'supabase');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (DATA_SOURCE === 'mock') return;
    let cancelled = false;

    const load = async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      const { data, error: err } = await supabase
        .from('transcripts')
        .select(LIST_SELECT)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (err) {
        setError(err.message);
        setTranscripts([]);
      } else {
        setError(null);
        const rows = (data ?? []) as unknown as DbRow[];
        setTranscripts(rows.map((r) => toTranscript(r).transcript));
      }
      setLoading(false);
    };

    load(true);

    const channel = supabase
      .channel(`meeting-pro-transcripts-list-${listChannelScope.current}-${nonce}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transcripts' }, () => {
        load(false);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [nonce, supabase]);

  return { transcripts, loading, error, source: DATA_SOURCE, reload };
}

interface DetailState {
  transcript: Transcript | undefined;
  loading: boolean;
  error: string | null;
  source: DataSource;
  getSpeakerById: (id: string) => Speaker | undefined;
  reload: () => void;
}

export function useTranscript(id: string): DetailState {
  const supabase = useSupabase();
  const [transcript, setTranscript] = useState<Transcript | undefined>(
    DATA_SOURCE === 'mock' ? demo.getDemoTranscriptById(id) : undefined
  );
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(DATA_SOURCE === 'supabase');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (DATA_SOURCE === 'mock') return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('transcripts')
      .select(DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setTranscript(undefined);
        } else if (data) {
          const mapped = toTranscript(data as unknown as DbRow);
          setError(null);
          setTranscript(mapped.transcript);
          setSpeakers(mapped.speakers);
        } else {
          // No row: either it does not exist or RLS hid it. Deliberately the same
          // outcome, so the app never confirms a transcript exists to someone who
          // may not see it.
          setError(null);
          setTranscript(undefined);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, nonce, supabase]);

  const getSpeakerById = useCallback(
    (speakerId: string) =>
      DATA_SOURCE === 'mock'
        ? demo.getDemoSpeakerById(speakerId)
        : speakers.find((s) => s.id === speakerId),
    [speakers]
  );

  return { transcript, loading, error, source: DATA_SOURCE, getSpeakerById, reload };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchState {
  /** Ids that matched, or null when there is no query and everything shows. */
  matchIds: Set<string> | null;
  searching: boolean;
  error: string | null;
}

/**
 * Search in the database, not in the list already on screen.
 *
 * search_transcript_ids combines full-text over the generated search column,
 * substring matching through the trigram index, and fuzzy word matching, so a
 * word inside a transcript, part of a word, or a typo all find the call. It
 * runs as the caller, so RLS scopes it to this business.
 */
export function useTranscriptSearch(query: string): SearchState {
  const supabase = useSupabase();
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (DATA_SOURCE === 'mock' || trimmed === '') {
      setMatchIds(null);
      setSearching(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    // Typing is faster than the round trip; wait for a pause.
    const timer = setTimeout(() => {
      supabase
        .rpc('search_transcript_ids', { p_query: trimmed })
        .then(({ data, error: err }) => {
          if (cancelled) return;
          if (err) {
            setError(err.message);
            setMatchIds(new Set());
          } else {
            setError(null);
            setMatchIds(new Set(((data ?? []) as { id: string }[]).map((row) => row.id)));
          }
          setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, supabase]);

  return { matchIds, searching, error };
}

// ---------------------------------------------------------------------------
// Action items
// ---------------------------------------------------------------------------

/**
 * Tick or untick an action item, and make it stick.
 *
 * The checkbox used to change local state only, so it looked like it worked and
 * then forgot. `authenticated` holds UPDATE on action_items and the RLS policy
 * scopes it to the user's own business.
 */
export async function setActionItemDone(
  actionItemId: string,
  done: boolean
): Promise<{ error: string | null }> {
  if (DATA_SOURCE === 'mock') return { error: null };
  const { error } = await getActiveSupabaseClient()
    .from('action_items')
    .update({ status: done ? 'done' : 'open' })
    .eq('id', actionItemId);
  return { error: error ? error.message : null };
}

// ---------------------------------------------------------------------------
// Retry
// ---------------------------------------------------------------------------

export interface RetryResult {
  outcome: 'ready' | 'already_ready' | 'failed' | 'not_retryable' | 'not_found' | 'error';
  message: string;
}

/**
 * Ask the server to fetch a failed transcript from Meta again. Runs as the
 * signed-in user: the retry-transcript function checks, through RLS, that they
 * may see this transcript before doing anything.
 */
export async function retryTranscript(transcriptId: string): Promise<RetryResult> {
  if (DATA_SOURCE === 'mock') {
    return { outcome: 'error', message: 'Retry is not available with mock data.' };
  }
  const { data, error } = await getActiveSupabaseClient().functions.invoke<RetryResult>(
    'retry-transcript',
    {
      body: { transcript_id: transcriptId },
    }
  );
  if (data?.outcome) return data;
  // supabase-js reports any non-2xx as an error, so a 404 lands here too. Read
  // the function's own message out of the response when there is one.
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = (await context.json()) as Partial<RetryResult>;
      if (body.outcome && body.message) return body as RetryResult;
    } catch {
      // fall through to the generic message
    }
  }
  return { outcome: 'error', message: 'Could not reach the server. Check your connection and try again.' };
}
