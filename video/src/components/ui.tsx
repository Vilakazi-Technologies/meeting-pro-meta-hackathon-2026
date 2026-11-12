import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, MONO, envelope, t } from '../theme';

/** Persistent backdrop: slow-drifting brand glows over a faint grid. */
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const a = f / 240;
  const orb = (x: number, y: number, size: number, color: string, phase: number) => (
    <div
      style={{
        position: 'absolute',
        left: x + Math.sin(a + phase) * 90,
        top: y + Math.cos(a * 0.8 + phase) * 70,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
        filter: 'blur(40px)',
      }}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      {orb(-250, -300, 1100, 'rgba(34,197,94,0.16)', 0)}
      {orb(1100, 350, 1200, 'rgba(59,130,246,0.18)', 2)}
      {orb(500, 700, 800, 'rgba(8,102,255,0.08)', 4)}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          backgroundPosition: `0 ${(f * 0.3) % 64}px`,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const Glass: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
  strong?: boolean;
}> = ({ style, children, strong }) => (
  <div
    style={{
      background: strong ? C.glassStrong : C.glass,
      border: `1px solid ${strong ? C.borderStrong : C.border}`,
      borderRadius: 28,
      boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
      backdropFilter: 'blur(24px)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Scene wrapper: fades the whole scene in/out over the persistent background. */
export const Scene: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const e = envelope(f, dur);
  return (
    <AbsoluteFill
      style={{
        opacity: e,
        transform: `scale(${interpolate(e, [0, 1], [0.985, 1])})`,
        fontFamily: FONT,
        color: C.text,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Top-left chapter marker, e.g. "02 · The problem". */
export const Chapter: React.FC<{ n: string; label: string }> = ({ n, label }) => {
  const f = useCurrentFrame();
  const p = t(f, 4, 30);
  return (
    <div
      style={{
        position: 'absolute',
        top: 64,
        left: 96,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 22, color: C.blueLight }}>{n}</span>
      <span style={{ width: 40 * p, height: 2, background: C.blueLight, opacity: 0.6 }} />
      <span
        style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: C.text2 }}
      >
        {label}
      </span>
    </div>
  );
};

/** Narration line at the bottom — the video is designed to read without audio. */
export const Caption: React.FC<{ children: React.ReactNode; start?: number; end?: number }> = ({
  children,
  start = 10,
  end,
}) => {
  const f = useCurrentFrame();
  const pIn = t(f, start, start + 20);
  const pOut = end === undefined ? 0 : t(f, end, end + 14);
  const o = pIn * (1 - pOut);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 84,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: o,
        transform: `translateY(${(1 - pIn) * 16}px)`,
      }}
    >
      <div
        style={{
          padding: '18px 34px',
          borderRadius: 999,
          background: 'rgba(0,0,0,0.55)',
          border: `1px solid ${C.border}`,
          fontSize: 32,
          color: C.text,
          maxWidth: 1500,
          textAlign: 'center',
          lineHeight: 1.35,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Pill: React.FC<{
  color: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ color, children, style }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 18px',
      borderRadius: 999,
      background: `${color}22`,
      border: `1px solid ${color}55`,
      color,
      fontSize: 22,
      fontWeight: 600,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Logo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img
    src={staticFile('logo.png')}
    style={{ width: size, height: size, borderRadius: size * 0.22, ...style }}
  />
);

/** Phone chrome sized for 1080p frames; content scrolls via `scrollY`. */
export const Phone: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  scrollY?: number;
  /** Rendered in screen space above the scrolling content (e.g. tap ripples). */
  overlay?: React.ReactNode;
}> = ({ children, style, scrollY = 0, overlay }) => (
  <div
    style={{
      width: 470,
      height: 940,
      borderRadius: 64,
      padding: 14,
      background: 'linear-gradient(160deg, #2a2a2e, #0c0c0e)',
      boxShadow: '0 60px 140px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.06)',
      ...style,
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 52,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(180deg, #050505, #0A0A0A)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 34,
          borderRadius: 20,
          background: '#000',
          zIndex: 10,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 34,
          right: 34,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 17,
          fontWeight: 600,
          color: C.text,
          zIndex: 11,
        }}
      >
        <span>09:41</span>
        <span style={{ letterSpacing: 2 }}>●●● ▮</span>
      </div>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <div style={{ paddingTop: 10, transform: `translateY(${-scrollY}px)` }}>{children}</div>
      </div>
      {overlay}
    </div>
  </div>
);

/** Small rounded card inside the phone UI. */
export const AppCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${C.border}`,
      borderRadius: 22,
      padding: 18,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Animated cursor/tap ripple at a point inside a container. */
export const Tap: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (f < at - 12 || f > at + 24) return null;
  const pre = interpolate(f, [at - 12, at], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: `3px solid rgba(255,255,255,${0.9 * (1 - p)})`,
        background: `rgba(255,255,255,${0.25 * pre * (1 - p)})`,
        transform: `scale(${0.6 + p * 0.9})`,
        zIndex: 50,
      }}
    />
  );
};
