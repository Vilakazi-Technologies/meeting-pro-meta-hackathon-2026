import { Ionicons } from '@expo/vector-icons';

// Static product copy. Not data: nothing here comes from, or belongs in, the
// database. It lived in mockData.ts, which mixed fake numbers with real
// marketing text and made the fake numbers look like data.
export interface FeatureHighlight {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    // Planned, not built: voice notes need their own pipeline, because Meta's
    // transcription covers calls only.
    icon: 'mic',
    title: 'Voice Note → Text',
    description: 'Coming soon — WhatsApp voice notes will be transcribed too.',
  },
  {
    // This one works. It is NOT real-time and never can be: Meta transcribes on
    // its own servers and sends the result only after the call has ended.
    icon: 'call',
    title: 'Call Transcription',
    description: 'Each WhatsApp call is transcribed and appears here shortly after it ends.',
  },
  {
    icon: 'search',
    title: 'Searchable Archive',
    description: 'Keyword tagging and full-text search across all sessions.',
  },
  {
    // Built on Supabase Edge; needs MODEL_API_KEY (Muse Spark) on the project.
    icon: 'bulb',
    title: 'AI Summaries',
    description:
      'Muse Spark turns each call into minutes and action items after the transcript lands.',
  },
];

// Shown where a value has no source in the database yet. Never a made-up number.
export const NO_VALUE = '—';
