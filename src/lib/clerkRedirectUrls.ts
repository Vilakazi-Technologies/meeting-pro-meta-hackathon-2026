/** Where Clerk should return users after auth (SPA / Expo web). */
export function clerkAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://meeting-pro-rho.vercel.app';
}

export function clerkAuthRedirectUrls() {
  const home = `${clerkAppOrigin()}/`;
  return {
    fallbackRedirectUrl: home,
    forceRedirectUrl: home,
  };
}
