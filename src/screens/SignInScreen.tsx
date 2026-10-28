import React from 'react';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { NativeClerkAuth } from '../components/auth/NativeClerkAuth';

/** Native: Clerk hook-driven sign-in / sign-up (same product as web). */
export function SignInScreen() {
  return (
    <AuthScreenShell>
      <NativeClerkAuth />
    </AuthScreenShell>
  );
}
