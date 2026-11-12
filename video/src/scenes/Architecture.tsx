import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, MONO, t } from '../theme';
import { Caption, Chapter, Glass, Scene } from '../components/ui';
import { IconApp, IconBolt, IconCloud, IconDb, IconPhone, IconSpark } from '../components/icons';

const NODES = [
  { icon: IconPhone, color: C.whatsapp, title: 'Customer calls', sub: 'WhatsApp Business number' },
  { icon: IconCloud, color: C.meta, title: 'Meta Cloud API', sub: 'Server-side call transcription' },
  { icon: IconBolt, color: C.amber, title: 'Signed webhook', sub: 'X-Hub-Signature-256 verified' },
  { icon: IconDb, color: C.green, title: 'Supabase', sub: 'Postgres + row-level security' },
  { icon: IconSpark, color: C.blueLight, title: 'Muse Spark', sub: 'Meta Model API · muse-spark-1.3' },
  { icon: IconApp, color: C.text, title: 'Meeting Pro', sub: 'Minutes, search, action items' },
];

const W = 250;
const STEP = 290;
const X0 = 110;
const Y = 370;
const H = 250;
const REVEAL = 78;

const STEPS = [
  'A customer phones the business on WhatsApp — nothing is recorded on the device.',
  'Meta transcribes the call on its own servers and notifies us.',
  'Our Edge Function verifies Meta’s signature, then stores the call exactly once.',
  'Each business only ever sees its own rows — enforced in the database.',
  'Muse Spark turns the transcript into a title, minutes, decisions and follow-ups.',
  'The owner opens Meeting Pro — every call is searchable memory.',
];

export const Architecture: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const callouts = t(f, 500, 530);
  return (
    <Scene dur={dur}>
      <Chapter n="02" label="How it works" />
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 60,
          fontWeight: 700,
          letterSpacing: -1,
          opacity: t(f, 6, 30),
        }}
      >
        Meta end-to-end: <span style={{ color: C.whatsapp }}>the channel</span> +{' '}
        <span style={{ color: C.blueLight }}>the intelligence</span>
      </div>

      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {NODES.slice(0, -1).map((_, i) => {
          const x1 = X0 + i * STEP + W;
          const x2 = X0 + (i + 1) * STEP;
          const y = Y + H / 2;
          const draw = t(f, 40 + (i + 1) * REVEAL - 20, 40 + (i + 1) * REVEAL + 10);
          const loopStart = 40 + (i + 1) * REVEAL + 10;
          const packets = [0, 0.5].map((off, k) => {
            if (f < loopStart) return null;
            const p = ((f - loopStart) / 40 + off) % 1;
            return (
              <circle
                key={k}
                cx={x1 + (x2 - x1) * p}
                cy={y}
                r={6}
                fill={NODES[i + 1].color}
                opacity={Math.sin(p * Math.PI)}
              />
            );
          });
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y}
                x2={x1 + (x2 - x1) * draw}
                y2={y}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={2}
                strokeDasharray="6 8"
              />
              {packets}
            </g>
          );
        })}
      </svg>

      {NODES.map((n, i) => {
        const at = 40 + i * REVEAL;
        const p = t(f, at, at + 30);
        const active = f >= at && f < at + REVEAL + 20 && f < 500;
        const Icon = n.icon;
        return (
          <Glass
            key={i}
            strong={active}
            style={{
              position: 'absolute',
              left: X0 + i * STEP,
              top: Y,
              width: W,
              height: H,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              opacity: p,
              transform: `translateY(${(1 - p) * 40}px) scale(${active ? 1.04 : 1})`,
              boxShadow: active
                ? `0 0 0 2px ${n.color}88, 0 0 60px ${n.color}44`
                : '0 30px 80px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 20,
                background: `${n.color}1f`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={34} color={n.color} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{n.title}</div>
            <div style={{ fontSize: 21, color: C.text2, lineHeight: 1.3 }}>{n.sub}</div>
            <div
              style={{
                position: 'absolute',
                top: 18,
                right: 22,
                fontFamily: MONO,
                fontSize: 18,
                color: C.muted,
              }}
            >
              0{i + 1}
            </div>
          </Glass>
        );
      })}

      <div
        style={{
          position: 'absolute',
          top: 710,
          left: 110,
          right: 110,
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
        }}
      >
        {[
          ['No on-device recording', 'Uses Meta’s documented Calling + transcription product'],
          ['Inside Meta’s 5-minute media window', 'Transcript files mirrored before the URL expires'],
          ['Idempotent ingest', 'Meta retries never create duplicate calls'],
        ].map(([a, b], i) => {
          const p = t(f, 500 + i * 14, 530 + i * 14);
          return (
            <Glass
              key={a}
              style={{
                flex: 1,
                padding: '24px 30px',
                opacity: p * callouts,
                transform: `translateY(${(1 - p) * 30}px)`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{a}</div>
              <div style={{ fontSize: 22, color: C.text2, marginTop: 6 }}>{b}</div>
            </Glass>
          );
        })}
      </div>

      {STEPS.map((s, i) => {
        const at = 40 + i * REVEAL;
        const end = i === STEPS.length - 1 ? 490 : at + REVEAL - 4;
        return (
          <Caption key={i} start={at} end={end}>
            {s}
          </Caption>
        );
      })}
      <Caption start={512}>Built on WhatsApp Cloud API and the Meta Model API.</Caption>
    </Scene>
  );
};
