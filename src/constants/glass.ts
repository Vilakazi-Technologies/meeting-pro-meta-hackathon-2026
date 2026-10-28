/**
 * iOS 26–inspired liquid glass on a pure black canvas.
 */
import { RADIUS, SPACING, BRAND } from './theme';

export const VILATECH_CANVAS = {
  background: BRAND.black,
  foreground: BRAND.white,
  muted: BRAND.gray900,
  liquidBorder: 'rgba(255, 255, 255, 0.14)',
  liquidHighlight: 'rgba(255, 255, 255, 0.18)',
  glow: 'rgba(255, 255, 255, 0.04)',
} as const;

/** Luminescent story washes — elliptical gradients (VILATECH site pattern), Meeting Pro palette. */
export const VILATECH_STORY = {
  dark: {
    css: `
      radial-gradient(ellipse 68% 48% at 22% 8%, rgba(34, 197, 94, 0.14) 0%, transparent 58%),
      radial-gradient(ellipse 52% 40% at 84% 20%, rgba(59, 130, 246, 0.16) 0%, transparent 58%),
      radial-gradient(ellipse 58% 42% at 50% 92%, rgba(96, 165, 250, 0.1) 0%, transparent 62%),
      radial-gradient(ellipse 38% 32% at 48% 42%, rgba(255, 255, 255, 0.045) 0%, transparent 72%)
    `,
    nativeWashes: [
      { colors: ['rgba(34,197,94,0.16)', 'rgba(34,197,94,0.04)', 'transparent'] as const, start: { x: 0, y: 0 }, end: { x: 1, y: 0.85 }, opacity: 0.85 },
      { colors: ['rgba(59,130,246,0.18)', 'rgba(59,130,246,0.05)', 'transparent'] as const, start: { x: 1, y: 0 }, end: { x: 0, y: 0.75 }, opacity: 0.8 },
      { colors: ['transparent', 'rgba(96,165,250,0.12)', 'rgba(34,197,94,0.06)'] as const, start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0.35 }, opacity: 0.75 },
      { colors: ['transparent', 'rgba(255,255,255,0.06)', 'transparent'] as const, start: { x: 0.35, y: 0.35 }, end: { x: 0.65, y: 0.65 }, opacity: 0.55 },
    ],
  },
  light: {
    css: `
      radial-gradient(ellipse 70% 50% at 18% 6%, rgba(34, 197, 94, 0.09) 0%, transparent 58%),
      radial-gradient(ellipse 55% 42% at 88% 16%, rgba(59, 130, 246, 0.11) 0%, transparent 58%),
      radial-gradient(ellipse 60% 44% at 52% 94%, rgba(59, 130, 246, 0.07) 0%, transparent 62%),
      radial-gradient(ellipse 42% 34% at 50% 38%, rgba(255, 255, 255, 0.65) 0%, transparent 70%)
    `,
    nativeWashes: [
      { colors: ['rgba(34,197,94,0.1)', 'rgba(34,197,94,0.02)', 'transparent'] as const, start: { x: 0, y: 0 }, end: { x: 1, y: 0.9 }, opacity: 0.9 },
      { colors: ['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.03)', 'transparent'] as const, start: { x: 1, y: 0 }, end: { x: 0, y: 0.8 }, opacity: 0.85 },
      { colors: ['transparent', 'rgba(59,130,246,0.08)', 'transparent'] as const, start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0.4 }, opacity: 0.7 },
      { colors: ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.08)', 'transparent'] as const, start: { x: 0.3, y: 0.2 }, end: { x: 0.7, y: 0.55 }, opacity: 0.45 },
    ],
  },
  grainOpacity: { dark: 0.032, light: 0.022 },
} as const;

export const GLASS = {
  blur: {
    ios: { standard: 32, elevated: 44, tabBar: 36, card: 32 },
    webPx: { standard: 20, elevated: 36, tabBar: 28, card: 32 },
  },
  saturate: { web: '180%' },
  fill: {
    cardDark:
      'linear-gradient(168deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 28%, rgba(255,255,255,0.01) 55%, rgba(255,255,255,0.05) 100%)',
    bodyDark: 'rgba(10, 10, 10, 0.62)',
    navDark: 'rgba(8, 8, 8, 0.78)',
    light: 'rgba(255, 255, 255, 0.72)',
    lightElevated: 'rgba(255, 255, 255, 0.85)',
    dark: 'rgba(255, 255, 255, 0.06)',
    darkElevated: 'rgba(255, 255, 255, 0.1)',
  },
  border: {
    light: 'rgba(0, 0, 0, 0.06)',
    dark: 'rgba(255, 255, 255, 0.1)',
    rim: 'rgba(255, 255, 255, 0.14)',
    hairline: 'rgba(255, 255, 255, 0.22)',
  },
  sheen: {
    top: ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as const,
    card: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0)'] as const,
    rimLight: ['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as const,
  },
  shadow: {
    card: {
      color: '#000',
      offset: { width: 0, height: 24 },
      opacity: 0.5,
      radius: 48,
      web: '0 24px 48px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.4)',
    },
    cta: {
      color: BRAND.qualityBlue,
      offset: { width: 0, height: 12 },
      opacity: 0.35,
      radius: 24,
    },
    frame: '0 28px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  radius: RADIUS,
  spacing: SPACING,
  press: {
    opacity: 0.9,
    scale: 0.988,
  },
} as const;

/** @deprecated Use VILATECH_CANVAS */
export const LUMIQ_CANVAS = VILATECH_CANVAS;
/** @deprecated Use VILATECH_STORY */
export const LUMIQ_STORY = VILATECH_STORY;
