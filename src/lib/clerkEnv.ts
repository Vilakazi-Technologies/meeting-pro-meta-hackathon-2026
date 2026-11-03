/** Publishable key — safe in the client bundle. Supports Expo and Vercel naming. */
export function getClerkPublishableKey(): string {
  return (
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

/** Frontend API host encoded in the publishable key (e.g. foo.clerk.accounts.dev). */
export function clerkFrontendApiHost(): string | null {
  const key = getClerkPublishableKey();
  const encoded = key.replace(/^pk_(test|live)_/, '');
  if (!encoded) return null;
  try {
    if (typeof atob !== 'function') return null;
    const decoded = atob(encoded);
    return decoded.replace(/\$$/, '') || null;
  } catch {
    return null;
  }
}

export function explainSupabaseAuthError(message: string): string {
  const host = clerkFrontendApiHost();
  if (/no suitable key|wrong key type|PGRST301/i.test(message)) {
    return host
      ? `Supabase rejected the Clerk token. In Supabase → Authentication → Clerk, the domain must be exactly ${host} (the app in .env).`
      : 'Supabase rejected the Clerk token. The Clerk provider domain must match the publishable key in .env.';
  }
  return message;
}
