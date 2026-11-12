import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MONO, t } from '../theme';
import { Caption, Chapter, Glass, Logo, Scene } from '../components/ui';
import {
  IconBolt,
  IconDb,
  IconGlobe,
  IconLayers,
  IconLock,
  IconRepeat,
  IconShield,
  IconSpark,
  IconUsers,
  IconClock,
} from '../components/icons';

const TILES = [
  { icon: IconDb, color: C.green, title: 'Multi-tenant Postgres', body: 'Row-level security on every table' },
  { icon: IconLock, color: C.blueLight, title: 'Clerk → Supabase', body: 'Third-party JWT auth, no shared keys' },
  { icon: IconShield, color: C.amber, title: 'Signed webhooks', body: 'X-Hub-Signature-256 HMAC verified' },
  { icon: IconRepeat, color: C.text, title: 'Idempotent ingest', body: 'Deduped events, safe Meta retries' },
  { icon: IconClock, color: C.whatsapp, title: '5-minute media window', body: 'Transcripts mirrored before expiry' },
  { icon: IconSpark, color: C.blueLight, title: 'Muse Spark minutes', body: 'Meta Model API · muse-spark-1.3' },
  { icon: IconLayers, color: C.green, title: 'Structured intelligence', body: 'Decisions, follow-ups, topics, jobs' },
  { icon: IconBolt, color: C.amber, title: 'Deployed', body: 'Vercel + Supabase Edge Functions' },
];

export const Production: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Scene dur={dur}>
      <Chapter n="07" label="Production execution" />
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: -1,
          opacity: t(f, 6, 30),
        }}
      >
        Not a prototype. <span style={{ color: C.green }}>Built for production.</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 290,
          left: 120,
          right: 120,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 26,
        }}
      >
        {TILES.map((x, i) => {
          const p = t(f, 30 + i * 16, 64 + i * 16);
          const Icon = x.icon;
          const glow = Math.max(0, Math.sin((f - 200 - i * 10) / 14));
          return (
            <Glass
              key={x.title}
              style={{
                padding: 30,
                height: 230,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                opacity: p,
                transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + p * 0.06})`,
                boxShadow: f > 200 ? `0 0 ${40 * glow}px ${x.color}33` : undefined,
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  background: `${x.color}1c`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={32} color={x.color} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>{x.title}</div>
              <div style={{ fontSize: 22, color: C.text2, lineHeight: 1.35 }}>{x.body}</div>
            </Glass>
          );
        })}
      </div>
      <Caption start={60}>Live today on Vercel, with a real seeded business tenant for judges.</Caption>
    </Scene>
  );
};

export const Business: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const cols = [
    {
      icon: IconUsers,
      color: C.whatsapp,
      title: 'Who',
      lines: ['SMEs that run on WhatsApp calls', 'Property, trades, logistics, services', 'South Africa first'],
    },
    {
      icon: IconGlobe,
      color: C.blueLight,
      title: 'How we earn',
      lines: ['Monthly SaaS subscription', 'Priced per WhatsApp Business number', 'Team seats on higher tiers'],
    },
    {
      icon: IconLayers,
      color: C.amber,
      title: 'What’s next',
      lines: ['CRM export (HubSpot first)', 'Team-wide search & reminders', 'Multi-number businesses'],
    },
  ];
  return (
    <Scene dur={dur}>
      <Chapter n="08" label="Business model" />
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: -1,
          opacity: t(f, 6, 30),
        }}
      >
        A business, not just a demo.
      </div>
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 160,
          right: 160,
          display: 'flex',
          gap: 34,
        }}
      >
        {cols.map((c, i) => {
          const p = t(f, 30 + i * 22, 66 + i * 22);
          const Icon = c.icon;
          return (
            <Glass
              key={c.title}
              style={{
                flex: 1,
                padding: 40,
                opacity: p,
                transform: `translateY(${(1 - p) * 50}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: `${c.color}1f`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={34} color={c.color} />
                </div>
                <div style={{ fontSize: 38, fontWeight: 700 }}>{c.title}</div>
              </div>
              <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {c.lines.map((l, j) => {
                  const q = t(f, 70 + i * 22 + j * 12, 96 + i * 22 + j * 12);
                  return (
                    <div
                      key={l}
                      style={{
                        fontSize: 27,
                        color: C.text2,
                        display: 'flex',
                        gap: 14,
                        opacity: q,
                        transform: `translateX(${(1 - q) * 16}px)`,
                      }}
                    >
                      <span style={{ color: c.color }}>—</span>
                      {l}
                    </div>
                  );
                })}
              </div>
            </Glass>
          );
        })}
      </div>
      <Caption start={150}>
        Built by VILATECH · Lumiq Industries — a team that already serves WhatsApp-first businesses.
      </Caption>
    </Scene>
  );
};

export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 13 } });
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
          gap: 30,
        }}
      >
        <Logo size={170} style={{ transform: `scale(${s})` }} />
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -2,
            textAlign: 'center',
            lineHeight: 1.1,
            opacity: t(f, 20, 50),
            transform: `translateY(${(1 - t(f, 20, 50)) * 24}px)`,
          }}
        >
          WhatsApp is the channel.
          <br />
          <span style={{ color: C.blueLight }}>Meeting Pro is the memory.</span>
        </div>
        <div
          style={{
            marginTop: 20,
            padding: '20px 44px',
            borderRadius: 999,
            background: 'rgba(59,130,246,0.16)',
            border: `1px solid ${C.blue}66`,
            fontFamily: MONO,
            fontSize: 36,
            color: C.text,
            opacity: t(f, 70, 95),
            transform: `scale(${0.9 + t(f, 70, 95) * 0.1})`,
          }}
        >
          meeting-pro-rho.vercel.app
        </div>
        <div style={{ fontSize: 26, color: C.text2, opacity: t(f, 110, 140) }}>
          WhatsApp Cloud API · Meta Model API (Muse Spark) · Supabase · Clerk · Vercel
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            letterSpacing: 3,
            color: C.muted,
            opacity: t(f, 140, 170),
          }}
        >
          VILATECH · VILATECH.CO · META AI DEVELOPER HACKATHON 2026
        </div>
      </div>
    </Scene>
  );
};
