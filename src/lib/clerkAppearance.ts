import type { ClerkAppearanceTheme } from '@clerk/shared/types';
import { BRAND } from '../constants/theme';

/** Liquid glass Clerk theme — VILATECH black canvas, blue primary, green success. */
export const vilatechClerkAppearance = {
  variables: {
    colorPrimary: BRAND.qualityBlue,
    colorDanger: '#F87171',
    colorSuccess: BRAND.trustGreen,
    colorWarning: '#FBBF24',
    colorText: BRAND.white,
    colorTextSecondary: BRAND.gray400,
    colorBackground: 'transparent',
    colorInputBackground: 'rgba(255, 255, 255, 0.06)',
    colorInputText: BRAND.white,
    borderRadius: '14px',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  },
  elements: {
    rootBox: { width: '100%', maxWidth: 420, margin: '0 auto' },
    cardBox: { width: '100%', boxShadow: 'none' },
    card: {
      backgroundColor: 'rgba(10, 10, 10, 0.72)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      boxShadow:
        '0 24px 48px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.16)',
    },
    logoBox: { display: 'none' },
    headerTitle: { fontSize: '1.25rem', fontWeight: '700', color: BRAND.white },
    headerSubtitle: { color: BRAND.gray400, fontSize: '0.9rem' },
    socialButtonsBlockButton: {
      borderColor: 'rgba(255,255,255,0.12)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    formButtonPrimary: {
      backgroundColor: BRAND.qualityBlue,
      boxShadow: '0 12px 28px rgba(59,130,246,0.35)',
    },
    footer: { background: 'transparent' },
    footerAction: { justifyContent: 'center', paddingTop: '0.75rem' },
    footerActionLink: { color: BRAND.qualityBlueLight, fontWeight: '600' },
    footerActionText: { color: BRAND.gray500 },
    identityPreviewEditButton: { color: BRAND.qualityBlueLight },
    formFieldInput: { borderColor: 'rgba(255,255,255,0.12)' },
    dividerLine: { backgroundColor: 'rgba(255,255,255,0.08)' },
    dividerText: { color: BRAND.gray500 },
    alertText: { color: BRAND.white },
  },
  layout: {
    socialButtonsPlacement: 'top',
    showOptionalFields: true,
  },
} as ClerkAppearanceTheme;

/** @deprecated Use vilatechClerkAppearance */
export const lumiqClerkAppearance = vilatechClerkAppearance;
