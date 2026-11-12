// Which workspace the signed-in user is looking at.
//
// 'member' — belongs to a business (their own, or Khaya for the team account).
// 'demo'   — opted into the read-only Khaya demo and has no business yet.
// 'none'   — signed in with nothing to show; the app offers the demo or setup.
//
// Before this, a new sign-in fell straight into empty screens and a developer
// error, so nobody outside the team ever saw the product working.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseContext';
import { DATA_SOURCE } from '../lib/supabaseConfig';
import { KHAYA_DEMO_BUSINESS_ID } from '../lib/demoEnvironment';
import { explainSupabaseAuthError } from '../lib/clerkEnv';

export type WorkspaceMode = 'loading' | 'member' | 'demo' | 'none' | 'error';

interface Workspace {
  mode: WorkspaceMode;
  /** True when the visible business is the seeded Khaya demo, for either mode. */
  isDemoData: boolean;
  error: string | null;
  enterDemo: () => Promise<void>;
  leaveDemo: () => Promise<void>;
  reload: () => void;
  /** A user with no business chose to link their own number from the welcome screen. */
  settingUp: boolean;
  setSettingUp: (on: boolean) => void;
}

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  // demo_access and the demo RPCs post-date the generated Database types.
  const supabase = useSupabase() as unknown as SupabaseClient;
  const [mode, setMode] = useState<WorkspaceMode>(DATA_SOURCE === 'mock' ? 'member' : 'loading');
  const [isDemoData, setIsDemoData] = useState(DATA_SOURCE === 'mock');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [settingUp, setSettingUp] = useState(false);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (DATA_SOURCE === 'mock') return;
    let cancelled = false;
    (async () => {
      const [members, demo] = await Promise.all([
        supabase.from('business_members').select('business_id').limit(1),
        supabase.from('demo_access').select('clerk_user_id').maybeSingle(),
      ]);
      if (cancelled) return;
      if (members.error) {
        setError(explainSupabaseAuthError(members.error.message));
        setMode('error');
        return;
      }
      setError(null);
      const own = members.data?.[0]?.business_id as string | undefined;
      if (own) {
        setIsDemoData(own === KHAYA_DEMO_BUSINESS_ID);
        setMode('member');
      } else if (!demo.error && demo.data) {
        setIsDemoData(true);
        setMode('demo');
      } else {
        setIsDemoData(false);
        setMode('none');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, nonce]);

  const enterDemo = useCallback(async () => {
    const { error: rpcError } = await supabase.rpc('enter_demo');
    if (rpcError) {
      setError(explainSupabaseAuthError(rpcError.message));
      return;
    }
    reload();
  }, [supabase, reload]);

  const leaveDemo = useCallback(async () => {
    const { error: rpcError } = await supabase.rpc('leave_demo');
    if (rpcError) {
      setError(explainSupabaseAuthError(rpcError.message));
      return;
    }
    reload();
  }, [supabase, reload]);

  return (
    <WorkspaceContext.Provider
      value={{ mode, isDemoData, error, enterDemo, leaveDemo, reload, settingUp, setSettingUp }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): Workspace {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
