import { useMemo } from 'react';
import { useCallHistory, CallRecord, formatCallDuration } from './callHistory';
import { useDashboardStats } from './dashboardStats';
import { DATA_SOURCE } from './transcriptSource';
import { demoCallOutcomes } from './demoCallRecords';

export type BusinessOutcome = 'positive' | 'neutral' | 'negative' | 'unknown';

export interface DayVolume {
  /** Short label e.g. Mon */
  label: string;
  answered: number;
  missed: number;
}

export interface ContactCallStats {
  /** Display phone or name key */
  key: string;
  label: string;
  total: number;
  answered: number;
  missed: number;
  avgDurationSeconds: number | null;
  answerRate: number | null;
  lastOutcome: BusinessOutcome;
}

export interface CallAnalytics {
  loading: boolean;
  error: string | null;
  totalCalls: number;
  answered: number;
  missed: number;
  answerRate: number | null;
  avgDurationSeconds: number | null;
  avgDurationLabel: string;
  minutesEmailed: number | null;
  positiveOutcomes: number | null;
  outcomeRate: number | null;
  medianTimeToTranscriptMinutes: number | null;
  volumeByDay: DayVolume[];
  contactStats: ContactCallStats[];
  recentCalls: CallRecord[];
}

function isAnswered(call: CallRecord): boolean {
  if (call.durationSeconds != null && call.durationSeconds > 0) return true;
  const s = (call.status ?? '').toUpperCase();
  return s === 'COMPLETED' || s === 'ANSWERED';
}

function isMissed(call: CallRecord): boolean {
  if (isAnswered(call)) return false;
  const s = (call.status ?? '').toUpperCase();
  return s === 'NO_ANSWER' || s === 'BUSY' || s === 'FAILED' || s === 'CANCELLED';
}

function normalizePhone(raw: string | null): string {
  if (!raw) return 'unknown';
  return raw.replace(/\D/g, '');
}

function outcomeForCall(call: CallRecord): BusinessOutcome {
  if (DATA_SOURCE === 'mock') {
    return demoCallOutcomes[call.id] ?? 'unknown';
  }
  if (call.transcriptState === 'ready' && call.transcriptTitle) return 'unknown';
  return 'unknown';
}

function buildVolumeByDay(calls: CallRecord[]): DayVolume[] {
  const days: DayVolume[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-ZA', { weekday: 'short' });
    const dayCalls = calls.filter((c) => c.startedAt?.slice(0, 10) === key);
    days.push({
      label,
      answered: dayCalls.filter(isAnswered).length,
      missed: dayCalls.filter(isMissed).length,
    });
  }
  return days;
}

function buildContactStats(calls: CallRecord[]): ContactCallStats[] {
  const map = new Map<
    string,
    {
      label: string;
      total: number;
      answered: number;
      missed: number;
      durationSum: number;
      durationCount: number;
      lastOutcome: BusinessOutcome;
    }
  >();

  for (const call of calls) {
    const key = normalizePhone(call.counterparty);
    const label = call.counterparty ?? 'Unknown number';
    const entry = map.get(key) ?? {
      label,
      total: 0,
      answered: 0,
      missed: 0,
      durationSum: 0,
      durationCount: 0,
      lastOutcome: 'unknown' as BusinessOutcome,
    };
    entry.total += 1;
    if (isAnswered(call)) {
      entry.answered += 1;
      if (call.durationSeconds != null) {
        entry.durationSum += call.durationSeconds;
        entry.durationCount += 1;
      }
    } else if (isMissed(call)) {
      entry.missed += 1;
    }
    entry.lastOutcome = outcomeForCall(call);
    map.set(key, entry);
  }

  return [...map.values()]
    .map((e) => ({
      key: e.label,
      label: e.label,
      total: e.total,
      answered: e.answered,
      missed: e.missed,
      avgDurationSeconds: e.durationCount > 0 ? e.durationSum / e.durationCount : null,
      answerRate: e.total > 0 ? e.answered / e.total : null,
      lastOutcome: e.lastOutcome,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

export function useCallAnalytics(): CallAnalytics {
  const { calls, loading: callsLoading, error: callsError } = useCallHistory();
  const dashboard = useDashboardStats();

  return useMemo(() => {
    const loading = callsLoading || dashboard.loading;
    const error = callsError ?? dashboard.error;

    const answered = calls.filter(isAnswered).length;
    const missed = calls.filter(isMissed).length;
    const totalCalls = calls.length;
    const answerRate = totalCalls > 0 ? answered / totalCalls : null;

    const durations = calls
      .map((c) => c.durationSeconds)
      .filter((s): s is number => s != null && s > 0);
    const avgDurationSeconds =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

    const outcomes = calls.map(outcomeForCall);
    const positiveOutcomes =
      DATA_SOURCE === 'mock'
        ? outcomes.filter((o) => o === 'positive').length
        : null;
    const knownOutcomes = outcomes.filter((o) => o !== 'unknown').length;
    const outcomeRate =
      knownOutcomes > 0 && positiveOutcomes != null ? positiveOutcomes / knownOutcomes : null;

    const minutesEmailed =
      dashboard.sessions != null
        ? calls.filter((c) => c.transcriptState === 'ready').length
        : null;

    return {
      loading,
      error,
      totalCalls,
      answered,
      missed,
      answerRate,
      avgDurationSeconds,
      avgDurationLabel: formatCallDuration(
        avgDurationSeconds != null ? Math.round(avgDurationSeconds) : null
      ),
      minutesEmailed,
      positiveOutcomes,
      outcomeRate,
      medianTimeToTranscriptMinutes: DATA_SOURCE === 'mock' ? 4.2 : null,
      volumeByDay: buildVolumeByDay(calls),
      contactStats: buildContactStats(calls),
      recentCalls: calls.slice(0, 5),
    };
  }, [calls, callsLoading, callsError, dashboard]);
}
