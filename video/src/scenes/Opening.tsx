import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MONO, t } from '../theme';
import { Caption, Chapter, Glass, Logo, Scene } from '../components/ui';
import { IconPhone } from '../components/icons';

/** Live waveform bars — echoes the logo mark. */
const Wave: React.FC<{ bars?: number; height?: number; start?: number }> = ({
  bars = 48,
  height = 120,
  start = 0,
}) => {
  const f = useCurrentFrame();
  const grow = t(f, start, start + 40);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const mid = 1 - Math.abs(i - bars / 2) / (bars / 2);
        const h =
          (0.15 + mid * 0.85) *
          (0.45 + 0.55 * Math.abs(Math.sin(f / 9 + i * 0.55) * Math.cos(f / 23 + i * 0.21)));
        const color = i % 3 === 0 ? C.blue : i % 5 === 0 ? C.green : 'rgba(255,255,255,0.85)';
        return (
          <div
            key={i}
            style={{
              width: 6,
              height: Math.max(6, h * height * grow),
              borderRadius: 3,
              background: color,
              opacity: 0.35 + mid * 0.65,
            }}
          />
        );
      })}
    </div>
  );
};

export const Intro: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 14, stiffness: 90 } });
  const title = 'Meeting Pro';
  return (
    <Scene dur={dur}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        <div style={{ position: 'relative', transform: `scale(${s})` }}>
          <div
            style={{
              position: 'absolute',
              inset: -60,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.45), transparent 65%)',
              opacity: 0.6 + 0.4 * Math.sin(f / 12),
            }}
          />
          <Logo size={220} style={{ position: 'relative' }} />
        </div>
        <div style={{ display: 'flex', fontSize: 128, fontWeight: 700, letterSpacing: -3 }}>
          {title.split('').map((ch, i) => {
            const p = t(f, 24 + i * 2.5, 54 + i * 2.5);
            return (
              <span
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 50}px)`,
                  whiteSpace: 'pre',
                  filter: `blur(${(1 - p) * 8}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 40,
            color: C.text2,
            opacity: t(f, 60, 90),
            transform: `translateY(${(1 - t(f, 60, 90)) * 20}px)`,
          }}
        >
          WhatsApp Business calls → searchable meeting minutes
        </div>
        <Wave start={70} />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 24,
            letterSpacing: 3,
            color: C.muted,
            opacity: t(f, 110, 140),
          }}
        >
          VILATECH · META AI DEVELOPER HACKATHON 2026 · STARTUP TRACK
        </div>
      </div>
    </Scene>
  );
};

const MOMENTS = [
  { who: 'Thandi → Ntokozo', text: 'Copper piping ≈ R8 500 incl. labour', x: 180, y: 360, r: -4 },
  { who: 'Riaan', text: '6 boxes of tiles short — deliver Monday', x: 1180, y: 300, r: 3 },
  { who: 'Thandi → Fatima', text: 'Invoice 20418 · R14 200 · 60 days overdue', x: 260, y: 640, r: 2 },
  { who: 'Zanele', text: 'Rivonia viewing · Saturday 10:00', x: 1120, y: 620, r: -3 },
  { who: 'Sipho', text: 'Site visit Thursday 08:00', x: 720, y: 470, r: 1 },
];

export const Problem: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const vanish = t(f, 270, 330);
  const head2 = t(f, 300, 330);
  return (
    <Scene dur={dur}>
      <Chapter n="01" label="The problem" />
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 76,
          fontWeight: 700,
          letterSpacing: -1.5,
          opacity: t(f, 8, 34) * (1 - head2),
          transform: `translateY(${(1 - t(f, 8, 34)) * 30}px)`,
        }}
      >
        South African businesses <span style={{ color: C.whatsapp }}>run on WhatsApp calls.</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 440,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: -1.5,
          opacity: head2,
          transform: `scale(${0.94 + head2 * 0.06})`,
        }}
      >
        Then you hang up — <span style={{ color: C.red }}>and it’s gone.</span>
      </div>
      {MOMENTS.map((m, i) => {
        const p = t(f, 50 + i * 28, 86 + i * 28);
        const drift = Math.sin(f / 30 + i) * 8;
        return (
          <Glass
            key={i}
            style={{
              position: 'absolute',
              left: m.x,
              top: m.y + drift,
              padding: '22px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              opacity: p * (1 - vanish),
              transform: `rotate(${m.r}deg) scale(${0.85 + p * 0.15 - vanish * 0.2})`,
              filter: `blur(${vanish * 14}px)`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: `${C.whatsapp}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconPhone size={28} color={C.whatsapp} />
            </div>
            <div>
              <div style={{ fontSize: 20, color: C.muted }}>{m.who} · WhatsApp call</div>
              <div style={{ fontSize: 30, fontWeight: 600 }}>{m.text}</div>
            </div>
          </Glass>
        );
      })}
      <Caption start={60} end={262}>
        Quotes, promises and deadlines are agreed on the phone every day.
      </Caption>
      <Caption start={290}>
        No notes. No search. No record of who promised what.
      </Caption>
    </Scene>
  );
};

export const Solution: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l1 = t(f, 10, 40);
  const l2 = t(f, 50, 80);
  const logo = spring({ frame: f - 40, fps, config: { damping: 15 } });
  return (
    <Scene dur={dur}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            opacity: l1,
            transform: `translateY(${(1 - l1) * 30}px)`,
          }}
        >
          WhatsApp is the <span style={{ color: C.whatsapp }}>channel.</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 34,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            opacity: l2,
            transform: `translateY(${(1 - l2) * 30}px)`,
          }}
        >
          <Logo size={110} style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -20}deg)` }} />
          <span>
            Meeting Pro is the <span style={{ color: C.blueLight }}>memory.</span>
          </span>
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 36,
            color: C.text2,
            opacity: t(f, 100, 130),
          }}
        >
          Meta transcribes the call · <span style={{ color: C.text }}>Muse Spark</span> writes the
          minutes
        </div>
      </div>
    </Scene>
  );
};

export const progressBar = (frame: number, total: number) =>
  interpolate(frame, [0, total], [0, 100], { extrapolateRight: 'clamp' });
