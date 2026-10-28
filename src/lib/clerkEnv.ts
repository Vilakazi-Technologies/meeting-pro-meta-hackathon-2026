/** Publishable key — safe in the client bundle. Supports Expo and Vercel naming. */
export function getClerkPublishableKey(): string {
  return (
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}
