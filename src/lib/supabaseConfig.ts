import { assertSupabaseConfigured, getSupabaseConfig } from './supabase';

export type DataSource = 'supabase' | 'mock';

export const DATA_SOURCE: DataSource =
  process.env.EXPO_PUBLIC_DATA_SOURCE === 'mock' ? 'mock' : 'supabase';

/** Call once after sign-in when using live Supabase data. */
export function ensureSupabaseReadyForApp(): void {
  if (DATA_SOURCE === 'mock') return;
  assertSupabaseConfigured();
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
