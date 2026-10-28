// Supabase data client — authenticated via Clerk JWT (third-party auth), not Supabase Auth.
//
// EXPO_PUBLIC_* URL and anon key are inlined at build time. RLS enforces access;
// the anon key alone cannot read protected tables.
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

function env(name: string): string {
  const value = process.env[name]?.trim();
  return value ?? '';
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = env('EXPO_PUBLIC_SUPABASE_URL');
  const anonKey = env('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function assertSupabaseConfigured(): { url: string; anonKey: string } {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      'Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (see .env.example), then restart Expo with --clear. ' +
        'For UI-only demos without a database, set EXPO_PUBLIC_DATA_SOURCE=mock.'
    );
  }
  return config;
}

export type AccessTokenFn = () => Promise<string | null>;

export function createSupabaseClient(
  accessToken: AccessTokenFn
): SupabaseClient<Database> {
  const { url, anonKey } = assertSupabaseConfigured();
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    accessToken,
  });
}

/** Mock / tests only — no Clerk token. Queries fail RLS unless DATA_SOURCE=mock. */
export function createSupabaseAnonOnly(): SupabaseClient<Database> {
  const { url, anonKey } = assertSupabaseConfigured();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
