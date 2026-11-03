import { DATA_SOURCE } from './supabaseConfig';

/** Khaya Property Services seed tenant — synthetic demo, not live Meta traffic. */
export const KHAYA_DEMO_BUSINESS_ID = 'dbdbdbdb-0000-4000-8000-000000000001';

export type AppDataEnvironment = 'mock' | 'demonstration' | 'supabase_live';

export function resolveAppDataEnvironment(): AppDataEnvironment {
  if (DATA_SOURCE === 'mock') return 'mock';
  return 'demonstration';
}

export function environmentBannerCopy(env: AppDataEnvironment): {
  title: string;
  detail: string;
  tone: 'amber' | 'sky' | 'neutral';
} {
  switch (env) {
    case 'mock':
      return {
        title: 'Local demo mode',
        detail: 'In-memory sample calls only. No database or WhatsApp integration.',
        tone: 'amber',
      };
    case 'demonstration':
      return {
        title: 'Demonstration workspace',
        detail:
          'Sample conversations (e.g. Khaya Property Services). Not live WhatsApp traffic until Meta credentials are connected.',
        tone: 'sky',
      };
    default:
      return {
        title: 'Live workspace',
        detail: 'Conversations from your connected WhatsApp Business integration.',
        tone: 'neutral',
      };
  }
}
