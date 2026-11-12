import { Easing, interpolate } from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const C = {
  bg: '#030304',
  bg2: '#0A0A0C',
  text: '#F5F5F5',
  text2: '#A1A1AA',
  muted: '#71717A',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  green: '#22C55E',
  whatsapp: '#25D366',
  meta: '#0866FF',
  amber: '#FBBF24',
  red: '#F87171',
  glass: 'rgba(255,255,255,0.055)',
  glassStrong: 'rgba(255,255,255,0.09)',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',
};

export const FONT =
  '"Segoe UI Variable Display", "Segoe UI", Inter, system-ui, -apple-system, sans-serif';
export const MONO = '"Cascadia Code", Consolas, "SFMono-Regular", monospace';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 between frames a and b with expo-out easing. */
export const t = (frame: number, a: number, b: number, easing = easeOut) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing });

export const lerp = (p: number, from: number, to: number) => from + (to - from) * p;

/** Scene envelope: fade/slide in at start, out at end. */
export const envelope = (frame: number, dur: number, inF = 14, outF = 14) =>
  interpolate(frame, [0, inF, dur - outF, dur], [0, 1, 1, 0], clamp);

/** Characters revealed for a typewriter effect. */
export const typed = (text: string, frame: number, start: number, cps = 40) => {
  const n = Math.max(0, Math.floor(((frame - start) / FPS) * cps));
  return text.slice(0, n);
};
