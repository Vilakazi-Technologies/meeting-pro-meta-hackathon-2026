import React from 'react';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { MeetingProClerkWeb } from '../components/auth/MeetingProClerkWeb';

/** Web: embedded Clerk SignIn / SignUp (hash routes). */
export function SignInScreen() {
  return (
    <AuthScreenShell>
      <MeetingProClerkWeb />
    </AuthScreenShell>
  );
}
