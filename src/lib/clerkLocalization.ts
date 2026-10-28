import { enUS } from '@clerk/localizations';
/** Clerk UI copy — Meeting Pro titles inside the embedded card. */
export const meetingProClerkLocalization = {
  ...enUS,
  signIn: {
    ...(enUS.signIn ?? {}),
    start: {
      ...(enUS.signIn?.start ?? {}),
      title: 'Welcome back',
      subtitle: 'Sign in to Meeting Pro — VILATECH',
    },
  },
  signUp: {
    ...(enUS.signUp ?? {}),
    start: {
      ...(enUS.signUp?.start ?? {}),
      title: 'Create your account',
      subtitle: 'Get started with Meeting Pro — VILATECH',
    },
  },
} as typeof enUS;
