import * as AuthSession from 'expo-auth-session';

/** Redirect URL for Clerk OAuth in Expo / Expo Go — add to Clerk Dashboard → Native → Redirect URLs. */
export function clerkOAuthRedirectUrl(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'meetingpro',
    path: 'oauth-callback',
  });
}
