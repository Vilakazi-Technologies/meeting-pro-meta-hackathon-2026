import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { setActiveSupabaseClient } from '../lib/supabaseRef';
import { useSession } from '@clerk/expo';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '../lib/supabase';
import { DATA_SOURCE } from '../lib/supabaseConfig';
import type { Database } from '../lib/database.types';

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

/** Inert client for mock mode so hooks can call useSupabase without network I/O. */
let mockSupabaseStub: SupabaseClient<Database> | null = null;
function getMockSupabaseStub(): SupabaseClient<Database> {
  if (!mockSupabaseStub) {
    mockSupabaseStub = createClient<Database>(
      'https://mock.local',
      'mock-anon-key',
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
  }
  return mockSupabaseStub;
}

/** Supabase client that sends the Clerk session token (third-party auth or JWT template). */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoaded } = useSession();

  const client = useMemo(() => {
    if (DATA_SOURCE === 'mock' || !isLoaded || !session) return null;
    return createSupabaseClient(async () => {
      try {
        const native = await session.getToken();
        if (native) return native;
      } catch {
        /* fall through */
      }
      try {
        return (await session.getToken({ template: 'supabase' })) ?? null;
      } catch {
        return null;
      }
    });
  }, [session, isLoaded]);

  useEffect(() => {
    if (!client) {
      setActiveSupabaseClient(null);
      return () => setActiveSupabaseClient(null);
    }
    setActiveSupabaseClient(client);
    return () => setActiveSupabaseClient(null);
  }, [client]);

  if (DATA_SOURCE === 'supabase' && (!isLoaded || !client)) {
    return (
      <View style={styles.boot} accessibilityRole="progressbar">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.bootText}>Connecting your workspace…</Text>
      </View>
    );
  }

  const value = DATA_SOURCE === 'mock' ? getMockSupabaseStub() : client;

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseClient<Database> {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabase must be used inside SupabaseProvider (after Clerk sign-in)');
  }
  return client;
}

/** Safe before sign-in: returns null when outside SupabaseProvider or unsigned. */
export function useSupabaseOptional(): SupabaseClient<Database> | null {
  return useContext(SupabaseContext);
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#0A0A0A',
  },
  bootText: { color: '#94A3B8', fontSize: 14 },
});
