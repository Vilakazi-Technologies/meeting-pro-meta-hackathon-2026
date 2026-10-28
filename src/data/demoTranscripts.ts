import { Speaker, Transcript } from '../types';
import { SPEAKER_COLORS } from '../constants/theme';

// Demo transcripts for EXPO_PUBLIC_DATA_SOURCE=mock.
//
// NOT used by any live screen. The data layer imports this only when demo mode
// is explicitly switched on, so it can never be mistaken for real data. This
// replaces the old mockData.ts, which also held invented dashboard numbers that
// the Home screen rendered as if they were real.
//
// The fake dashboard figures are gone for good. Nothing here is a count.
export const demoSpeakers: Speaker[] = [
  { id: 's1', name: 'Sarah M.', color: SPEAKER_COLORS[0] },
  { id: 's2', name: 'James K.', color: SPEAKER_COLORS[1] },
  { id: 's3', name: 'VILATECH Ops', color: SPEAKER_COLORS[2] },
  { id: 's4', name: 'Partner Team', color: SPEAKER_COLORS[3] },
];

export const demoTranscripts: Transcript[] = [
  {
    id: 't1',
    title: 'VILATECH Q3 Strategy Call',
    source: 'whatsapp_call',
    status: 'completed',
    date: '2026-08-04T09:30:00',
    duration: '42 min',
    participants: ['Sarah M.', 'James K.', 'VILATECH Ops'],
    tags: ['strategy', 'Q3', 'partnership'],
    summary:
      'Team aligned on VILATECH Industries rollout timeline. WhatsApp transcriber goes to pilot with 3 enterprise clients in September. Action items assigned for API integration and CRM export.',
    actionItems: [
      { id: 'a1', text: 'Send Meeting Pro prototype to leadership', assignee: 'Sarah M.', completed: true },
      { id: 'a2', text: 'Configure WhatsApp Business API webhook', assignee: 'James K.', completed: false },
      { id: 'a3', text: 'Draft CRM export spec for HubSpot', assignee: 'VILATECH Ops', completed: false },
    ],
    segments: [
      { id: 'seg1', speakerId: 's1', text: 'Good morning everyone. Let\'s review the VILATECH rollout plan for Meeting Pro.', timestamp: '00:00:12' },
      { id: 'seg2', speakerId: 's2', text: 'The React Native prototype is ready for partner review. Glass UI adapts to iOS 26 Liquid Glass automatically.', timestamp: '00:01:45' },
      { id: 'seg3', speakerId: 's3', text: 'Perfect. We need live call transcription and voice note capture working before the September pilot.', timestamp: '00:03:20' },
      { id: 'seg4', speakerId: 's1', text: 'Agreed. Keyword tagging and searchable archive are must-haves for the enterprise tier.', timestamp: '00:05:08' },
    ],
    keywordMatches: 4,
  },
  {
    id: 't2',
    title: 'Voice Note — Client Brief',
    source: 'whatsapp_voice',
    status: 'completed',
    date: '2026-08-03T14:15:00',
    duration: '3 min',
    participants: ['James K.'],
    tags: ['client', 'brief', 'urgent'],
    summary: 'Client requested searchable transcripts for all WhatsApp voice notes. Budget approved for Meeting Pro tier.',
    actionItems: [
      { id: 'a4', text: 'Prepare pricing proposal for Meeting Pro', assignee: 'James K.', completed: false },
    ],
    keywordMatches: 2,
  },
  {
    id: 't3',
    title: 'Weekly Standup — VILATECH Industries',
    source: 'meeting',
    status: 'live',
    date: '2026-08-04T18:00:00',
    duration: 'Live',
    participants: ['Sarah M.', 'James K.', 'Partner Team'],
    tags: ['standup', 'weekly'],
    keywordMatches: 0,
  },
  {
    id: 't4',
    title: 'WhatsApp Call — Vendor Onboarding',
    source: 'whatsapp_call',
    status: 'processing',
    date: '2026-08-04T11:00:00',
    duration: '18 min',
    participants: ['VILATECH Ops', 'Partner Team'],
    tags: ['vendor', 'onboarding'],
    keywordMatches: 0,
  },
  {
    id: 't5',
    title: 'Board Meeting Recording',
    source: 'upload',
    status: 'completed',
    date: '2026-08-01T16:00:00',
    duration: '1h 12m',
    participants: ['Sarah M.', 'James K.', 'VILATECH Ops', 'Partner Team'],
    tags: ['board', 'quarterly', 'finance'],
    summary: 'Q2 results exceeded targets. Approved budget for WhatsApp transcriber enterprise deployment across 5 regions.',
    actionItems: [
      { id: 'a5', text: 'Schedule regional pilot kickoffs', assignee: 'Partner Team', completed: false },
      { id: 'a6', text: 'Finalize SLA for enterprise tier', assignee: 'Sarah M.', completed: false },
    ],
    keywordMatches: 6,
  },
];

export function getDemoTranscriptById(id: string): Transcript | undefined {
  return demoTranscripts.find((t) => t.id === id);
}

export function getDemoSpeakerById(id: string): Speaker | undefined {
  return demoSpeakers.find((s) => s.id === id);
}
