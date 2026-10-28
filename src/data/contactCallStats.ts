import { useMemo } from 'react';
import { useCallAnalytics, BusinessOutcome } from './callAnalytics';

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export interface ContactInsights {
  totalCalls: number;
  answerRate: number | null;
  avgMinutes: number | null;
  lastOutcome: BusinessOutcome;
}

/** Match business contact phone to aggregated call analytics. */
export function useContactInsights(phone: string): ContactInsights {
  const { contactStats } = useCallAnalytics();
  return useMemo(() => {
    const key = normalizePhone(phone);
    const match = contactStats.find((c) => normalizePhone(c.label) === key);
    if (!match) {
      return { totalCalls: 0, answerRate: null, avgMinutes: null, lastOutcome: 'unknown' };
    }
    return {
      totalCalls: match.total,
      answerRate: match.answerRate,
      avgMinutes:
        match.avgDurationSeconds != null ? Math.round(match.avgDurationSeconds / 60) : null,
      lastOutcome: match.lastOutcome,
    };
  }, [contactStats, phone]);
}

export function outcomeLabel(o: BusinessOutcome): string {
  switch (o) {
    case 'positive':
      return 'Positive outcome';
    case 'neutral':
      return 'Neutral';
    case 'negative':
      return 'Needs follow-up';
    default:
      return 'Not scored yet';
  }
}
