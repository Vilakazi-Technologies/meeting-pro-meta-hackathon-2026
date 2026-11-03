/**
 * Motion foundations (adapted for Expo / Reanimated).
 * Durations guide attention; springs communicate press/state.
 * Never animate layout props — transform + opacity only.
 */
export const motionTokens = {
  duration: {
    instant: 100,
    fast: 160,
    normal: 280,
    slow: 420,
    crawl: 700,
  },
  distance: {
    sm: 6,
    md: 12,
    lg: 20,
  },
  scale: {
    press: 0.97,
    settle: 1,
  },
} as const;

/** Reanimated spring configs — named presets only. */
export const springs = {
  snappy: { damping: 22, stiffness: 320, mass: 0.8 },
  gentle: { damping: 26, stiffness: 180, mass: 1 },
  bouncy: { damping: 14, stiffness: 220, mass: 0.9 },
  instant: { damping: 30, stiffness: 500, mass: 0.6 },
} as const;

export type SpringName = keyof typeof springs;
