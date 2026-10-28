/** Meeting Pro — black / white / gray + trust green + quality blue. */
export const BRAND = {
  black: '#000000',
  gray950: '#0A0A0A',
  gray900: '#141414',
  gray700: '#404040',
  gray500: '#737373',
  gray400: '#A3A3A3',
  gray200: '#E5E5E5',
  white: '#FAFAFA',
  trustGreen: '#22C55E',
  trustGreenDark: '#16A34A',
  qualityBlue: '#3B82F6',
  qualityBlueDark: '#2563EB',
  qualityBlueLight: '#60A5FA',
  /** WhatsApp brand — connection status only */
  whatsapp: '#25D366',
  whatsappDark: '#128C7E',
  accent: '#3B82F6',
  accentLight: '#60A5FA',
  gold: '#737373',
  navy: '#000000',
  navyMid: '#0A0A0A',
  navyLight: '#141414',
};

export const CHART = {
  answered: BRAND.trustGreen,
  missed: BRAND.gray700,
  accent: BRAND.qualityBlue,
  grid: 'rgba(255,255,255,0.08)',
  axis: BRAND.gray500,
};

export const COLORS = {
  light: {
    background: '#F4F4F5',
    backgroundGradient: ['#FAFAFA', '#F3F4F6', '#ECEFF3', '#F5F5F5'] as const,
    text: '#0A0A0A',
    textSecondary: '#404040',
    textMuted: '#737373',
    glassFill: 'rgba(255, 255, 255, 0.72)',
    glassFillLiquid: 'rgba(255, 255, 255, 0.58)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    glassHighlight: 'rgba(255, 255, 255, 0.9)',
    success: BRAND.trustGreenDark,
    warning: '#CA8A04',
    error: '#DC2626',
    live: '#DC2626',
    separator: 'rgba(0, 0, 0, 0.06)',
  },
  dark: {
    background: '#050505',
    backgroundGradient: ['#000000', '#030303', '#0A0A0A', '#050505', '#000000'] as const,
    text: '#F5F5F5',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    glassFill: 'rgba(255, 255, 255, 0.055)',
    glassFillLiquid: 'rgba(255, 255, 255, 0.09)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHighlight: 'rgba(255, 255, 255, 0.18)',
    separator: 'rgba(255, 255, 255, 0.08)',
    success: BRAND.trustGreen,
    warning: '#FBBF24',
    error: '#F87171',
    live: '#F87171',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  full: 9999,
};

export const FONT = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  hero: 34,
};

export const SPEAKER_COLORS = [
  BRAND.qualityBlue,
  BRAND.trustGreen,
  BRAND.qualityBlueLight,
  BRAND.trustGreenDark,
  BRAND.gray400,
  '#94A3B8',
];

export const PLAN_LABELS = {
  voice_call: 'Voice & Call',
  meeting_pro: 'Meeting Pro',
  enterprise: 'Enterprise Agent',
} as const;

export type ThemePalette = typeof COLORS.light | typeof COLORS.dark;
export type ThemeMode = keyof typeof COLORS;
