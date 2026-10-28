import { Platform } from 'react-native';
import { FONT } from './theme';

/** Apple-style type roles — Large Title → Footnote. */
export const TYPO = {
  eyebrow: {
    fontSize: FONT.xs,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  largeTitle: {
    fontSize: FONT.hero,
    fontWeight: '700' as const,
    letterSpacing: Platform.OS === 'ios' ? -0.6 : -0.4,
    lineHeight: 40,
  },
  title2: {
    fontSize: FONT.xxl,
    fontWeight: '700' as const,
    letterSpacing: -0.35,
    lineHeight: 32,
  },
  title3: {
    fontSize: FONT.lg,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  headline: {
    fontSize: FONT.base,
    fontWeight: '600' as const,
    letterSpacing: -0.15,
    lineHeight: 21,
  },
  body: {
    fontSize: FONT.base,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  callout: {
    fontSize: FONT.sm,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  footnote: {
    fontSize: FONT.xs,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 16,
  },
  metric: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 32,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
};
