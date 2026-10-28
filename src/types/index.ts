// 'failed': Meta's transcript could not be downloaded or verified. Shown to the
// customer with a retry, never hidden — a call that silently vanishes is worse
// than a visible error.
export type TranscriptStatus = 'completed' | 'processing' | 'live' | 'failed';
export type TranscriptSource = 'whatsapp_voice' | 'whatsapp_call' | 'meeting' | 'upload';

export interface Speaker {
  id: string;
  name: string;
  color: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  completed: boolean;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  text: string;
  timestamp: string;
}

// Where the summary pass has got to. 'pending' means it has not run — which is
// the case for every transcript until ANTHROPIC_API_KEY is set on the Supabase
// project. Distinguishing it from 'failed' is what lets the app say "not yet"
// without implying something went wrong.
export type SummaryStatus = 'pending' | 'ready' | 'failed';

export interface Transcript {
  id: string;
  title: string;
  source: TranscriptSource;
  status: TranscriptStatus;
  date: string;
  duration: string;
  participants: string[];
  tags: string[];
  summary?: string;
  summaryStatus?: SummaryStatus;
  actionItems?: ActionItem[];
  segments?: TranscriptSegment[];
  keywordMatches?: number;
}


export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  TranscriptDetail: { transcriptId: string };
  WhatsAppConnect: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  Live: undefined;
  Archive: undefined;
  Settings: undefined;
};
