import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let active: SupabaseClient<Database> | null = null;

export function setActiveSupabaseClient(client: SupabaseClient<Database> | null): void {
  active = client;
}

export function getActiveSupabaseClient(): SupabaseClient<Database> {
  if (!active) {
    throw new Error('Supabase client is not ready — sign in first.');
  }
  return active;
}
