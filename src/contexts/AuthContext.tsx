import React, { createContext, useContext, useMemo } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/expo';

interface AuthContextValue {
  isSignedIn: boolean;
  initializing: boolean;
  userId: string | null;
  email: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** App-level auth facade over Clerk (identity) + Supabase (data via JWT template). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut: clerkSignOut, userId } = useClerkAuth();
  const { user } = useUser();

  const value = useMemo<AuthContextValue>(
    () => ({
      isSignedIn: Boolean(isSignedIn),
      initializing: !isLoaded,
      userId: userId ?? null,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      signOut: async () => {
        await clerkSignOut();
      },
    }),
    [isLoaded, isSignedIn, userId, user?.primaryEmailAddress?.emailAddress, clerkSignOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
