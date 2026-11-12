import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MONO, easeInOut, t, typed } from '../theme';
import { AppCard, Caption, Chapter, Logo, Phone, Pill, Scene, Tap } from '../components/ui';
import {
  IconAlert,
  IconCheck,
  IconPhone,
  IconRefresh,
  IconSearch,
  IconSpark,
} from '../components/icons';

type Bullet = { at: number; title: string; body: string };

/** Left narrative + right phone, shared by every app scene. */
const Split: React.FC<{
  n: string;
  chapter: string;
  heading: React.ReactNode;
  bullets: Bullet[];
  phone: React.ReactNode;
}> = ({ n, chapter, heading, bullets, phone }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ph = spring({ frame: f - 4, fps, config: { damping: 18, stiffness: 80 } });
  const active = bullets.reduce((acc, b, i) => (f >= b.at ? i : acc), -1);
  return (
    <>
      <Chapter n={n} label={chapter} />
      <div style={{ position: 'absolute', left: 120, top: 210, width: 820 }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.08,
            opacity: t(f, 6, 30),
            transform: `translateY(${(1 - t(f, 6, 30)) * 24}px)`,
          }}
        >
          {heading}
        </div>
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 30 }}>
          {bullets.map((b, i) => {
            const p = t(f, b.at, b.at + 24);
            const on = i === active;
            return (
              <div
                key={b.title}
                style={{
                  display: 'flex',
                  gap: 22,
                  opacity: p * (on ? 1 : 0.45),
                  transform: `translateX(${(1 - p) * -30}px)`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    borderRadius: 3,
                    background: on ? C.blue : 'rgba(255,255,255,0.15)',
                  }}
                />
                <div>
                  <div style={{ fontSize: 34, fontWeight: 650 }}>{b.title}</div>
                  <div style={{ fontSize: 26, color: C.text2, marginTop: 6, lineHeight: 1.35 }}>
                    {b.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 200,
          top: 70,
          transform: `translateY(${(1 - ph) * 140}px) rotate(${(1 - ph) * 4}deg)`,
          opacity: ph,
        }}
      >
        {phone}
      </div>
    </>
  );
};

const TabBar: React.FC<{ active: number }> = ({ active }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 84,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      background: 'rgba(10,10,12,0.92)',
      borderTop: `1px solid ${C.border}`,
      fontSize: 15,
      zIndex: 20,
    }}
  >
    {['Home', 'Calls', 'Search', 'Settings'].map((l, i) => (
      <div
        key={l}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          color: i === active ? C.blueLight : C.muted,
          fontWeight: i === active ? 700 : 500,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            border: `2px solid ${i === active ? C.blueLight : C.muted}`,
          }}
        />
        {l}
      </div>
    ))}
  </div>
);

const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 26, color = '#fff' }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '3px solid rgba(128,128,128,0.3)',
        borderTopColor: color,
        transform: `rotate(${f * 12}deg)`,
      }}
    />
  );
};

/* ───────────────────────── Sign-in ───────────────────────── */

export const SignIn: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const pressed = f >= 96 && f < 104;
  const loading = f >= 100 && f < 150;
  const done = t(f, 150, 170);
  return (
    <Scene dur={dur}>
      <Split
        n="03"
        chapter="Live product"
        heading={
          <>
            Sign in.
            <br />
            <span style={{ color: C.text2 }}>Your business, your data.</span>
          </>
        }
        bullets={[
          { at: 30, title: 'Clerk authentication', body: 'Google sign-in, sessions on web and mobile.' },
          {
            at: 90,
            title: 'Multi-tenant by design',
            body: 'Clerk’s token is trusted by Supabase — row-level security scopes every query.',
          },
        ]}
        phone={
          <Phone
            overlay={
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 18,
                    opacity: done,
                    transform: `scale(${0.9 + done * 0.1})`,
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      background: `${C.green}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCheck size={50} color={C.green} stroke={3} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>Welcome, Thandi</div>
                  <div style={{ fontSize: 20, color: C.text2 }}>Khaya Property Services</div>
                </div>
                <Tap x={221} y={568} at={96} />
              </>
            }
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '110px 34px 0',
                gap: 18,
                opacity: 1 - done,
              }}
            >
              <Logo size={120} />
              <div style={{ fontSize: 40, fontWeight: 700, marginTop: 10 }}>Meeting Pro</div>
              <div style={{ fontSize: 20, color: C.text2, textAlign: 'center' }}>
                Every WhatsApp call, remembered.
              </div>
              <div
                style={{
                  marginTop: 90,
                  width: '100%',
                  height: 64,
                  borderRadius: 18,
                  background: '#fff',
                  color: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  fontSize: 22,
                  fontWeight: 650,
                  transform: `scale(${pressed ? 0.96 : 1})`,
                }}
              >
                {loading ? (
                  <Spinner color="#111" />
                ) : (
                  <>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background:
                          'conic-gradient(#EA4335 0 25%, #FBBC05 0 50%, #34A853 0 75%, #4285F4 0)',
                      }}
                    />
                    Continue with Google
                  </>
                )}
              </div>
              <div style={{ fontSize: 16, color: C.muted, marginTop: 6 }}>Secured by Clerk</div>
            </div>
          </Phone>
        }
      />
    </Scene>
  );
};

/* ───────────────────────── Dashboard ───────────────────────── */

const WEEK = [2, 3, 1, 4, 2, 1, 1];

export const Dashboard: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const count = (to: number, at: number) =>
    Math.round(interpolate(f, [at, at + 40], [0, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut }));
  return (
    <Scene dur={dur}>
      <Split
        n="03"
        chapter="Live product"
        heading={
          <>
            Your calls,
            <br />
            <span style={{ color: C.text2 }}>at a glance.</span>
          </>
        }
        bullets={[
          {
            at: 30,
            title: 'WhatsApp Business connected',
            body: 'Khaya Property Services — a real seeded tenant on production.',
          },
          { at: 110, title: 'Live counts from Postgres', body: '14 calls · 13 transcribed · 1 needs attention.' },
          { at: 200, title: 'Call volume by day', body: 'Spot busy days and missed follow-ups early.' },
        ]}
        phone={
          <Phone overlay={<TabBar active={0} />}>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 18, color: C.muted }}>Good morning</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: -10 }}>
                Khaya Property Services
              </div>
              <div style={{ opacity: t(f, 30, 50) }}>
                <Pill color={C.whatsapp} style={{ fontSize: 17, padding: '6px 14px' }}>
                  ● WhatsApp connected
                </Pill>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  ['Calls', count(14, 100), C.text],
                  ['Transcribed', count(13, 110), C.green],
                  ['Attention', count(1, 120), C.red],
                ].map(([l, v, col]) => (
                  <AppCard key={l as string} style={{ flex: 1, padding: 16 }}>
                    <div style={{ fontSize: 15, color: C.muted }}>{l}</div>
                    <div style={{ fontSize: 40, fontWeight: 700, color: col as string }}>{v}</div>
                  </AppCard>
                ))}
              </div>
              <AppCard>
                <div style={{ fontSize: 18, fontWeight: 650 }}>Call volume · this week</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 14,
                    height: 180,
                    marginTop: 16,
                  }}
                >
                  {WEEK.map((v, i) => {
                    const p = t(f, 190 + i * 6, 230 + i * 6);
                    return (
                      <div
                        key={i}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: (v / 4) * 140 * p,
                            borderRadius: 8,
                            background: `linear-gradient(180deg, ${C.blueLight}, ${C.blue})`,
                          }}
                        />
                        <div style={{ fontSize: 14, color: C.muted }}>{'MTWTFSS'[i]}</div>
                      </div>
                    );
                  })}
                </div>
              </AppCard>
              <AppCard style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: t(f, 250, 270) }}>
                <IconSpark size={26} color={C.blueLight} />
                <div style={{ fontSize: 17, color: C.text2 }}>
                  Minutes drafted by <b style={{ color: C.text }}>Muse Spark</b>
                </div>
              </AppCard>
            </div>
          </Phone>
        }
      />
    </Scene>
  );
};

/* ───────────────────────── Calls list ───────────────────────── */

const CALLS = [
  { title: 'Plumbing quote for Parkhurst cottage', who: 'Ntokozo Dlamini', ok: true },
  { title: 'Delivery dispute — tiles short on order', who: 'Riaan van der Merwe', ok: true },
  { title: 'Viewing arranged for Rivonia two-bedroom', who: 'Zanele', ok: true },
  { title: 'Overdue invoice — Fourways maintenance', who: 'Fatima', ok: true },
  { title: 'Emergency — burst geyser in Midrand unit', who: 'Thandiwe', ok: true },
  { title: 'Quote accepted — Randburg office repaint', who: 'Sipho', ok: true },
  { title: 'Transcript unavailable', who: 'Retry available', ok: false },
];

export const Calls: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const sel = f >= 236;
  return (
    <Scene dur={dur}>
      <Split
        n="03"
        chapter="Live product"
        heading={
          <>
            Every call becomes
            <br />
            <span style={{ color: C.text2 }}>a titled record.</span>
          </>
        }
        bullets={[
          { at: 30, title: 'Titles written by Muse Spark', body: 'No more “Call 14:02” — you see what the call was about.' },
          { at: 130, title: 'Honest status', body: 'Ready, processing or failed — failures are never hidden.' },
        ]}
        phone={
          <Phone
            overlay={
              <>
                <Tap x={220} y={176} at={236} />
                <TabBar active={1} />
              </>
            }
          >
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>Calls</div>
              {CALLS.map((c, i) => {
                const p = t(f, 20 + i * 10, 50 + i * 10);
                const hi = i === 0 && sel;
                return (
                  <AppCard
                    key={c.title}
                    style={{
                      padding: 14,
                      display: 'flex',
                      gap: 14,
                      alignItems: 'center',
                      opacity: p,
                      transform: `translateY(${(1 - p) * 30}px) scale(${hi ? 0.97 : 1})`,
                      background: hi ? 'rgba(59,130,246,0.18)' : undefined,
                      borderColor: hi ? `${C.blue}88` : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        flexShrink: 0,
                        background: c.ok ? `${C.whatsapp}1f` : `${C.red}1f`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.ok ? (
                        <IconPhone size={22} color={C.whatsapp} />
                      ) : (
                        <IconAlert size={22} color={C.red} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 650,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: 330,
                          color: c.ok ? C.text : C.red,
                        }}
                      >
                        {c.title}
                      </div>
                      <div style={{ fontSize: 15, color: C.muted, marginTop: 3 }}>
                        {c.who} {c.ok ? '· Minutes ready' : ''}
                      </div>
                    </div>
                  </AppCard>
                );
              })}
            </div>
          </Phone>
        }
      />
    </Scene>
  );
};

/* ───────────────────────── Transcript detail ───────────────────────── */

const SUMMARY =
  'Ntokozo asked for a quote to replace the hot water piping in the back cottage in Parkhurst. Thandi quoted roughly R8 500 including labour, subject to a site visit, and booked the plumber for Thursday morning.';

const SEGMENTS: [string, string][] = [
  ['Business', 'Good morning, Khaya Property Services, Thandi speaking.'],
  ['Customer', 'Morning Thandi, it’s Ntokozo Dlamini. I’m phoning about the cottage at the back of my place in Parkhurst.'],
  ['Customer', 'The hot water takes forever and when it comes it’s brown.'],
  ['Business', 'We’d replace the hot water runs with copper — around eight and a half thousand rand including labour.'],
  ['Business', 'If there’s more damage I’ll phone you before we carry on. I won’t just run up the bill.'],
  ['Business', 'I can get Sipho there Thursday morning, eight o’clock.'],
];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 21, fontWeight: 700, marginTop: 8 }}>{children}</div>
);

export const Transcript: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const scroll = interpolate(
    f,
    [0, 230, 290, 600, 690],
    [0, 0, 420, 420, 1060],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut }
  );
  const thinking = f >= 40 && f < 70;
  const text = typed(SUMMARY, f, 70, 55);
  const tick = (at: number) => t(f, at, at + 14);
  return (
    <Scene dur={dur}>
      <Split
        n="04"
        chapter="Meta AI inside"
        heading={
          <>
            Muse Spark writes
            <br />
            <span style={{ color: C.blueLight }}>the minutes.</span>
          </>
        }
        bullets={[
          { at: 40, title: 'Summary in plain language', body: 'Generated by muse-spark-1.3 through the Meta Model API.' },
          { at: 240, title: 'Decisions, agreements, unresolved', body: 'Structured intelligence — not just a paragraph.' },
          { at: 440, title: 'Action items with owners', body: 'Ticked off in the app and saved to the database.' },
          { at: 600, title: 'Speaker-separated transcript', body: 'Meta splits Business and Customer by audio channel.' },
        ]}
        phone={
          <Phone scrollY={scroll} overlay={<><Tap x={54} y={440} at={500} /><Tap x={54} y={520} at={540} /></>}>
            <div style={{ padding: '14px 22px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 18, color: C.blueLight }}>← Calls</div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
                Plumbing quote for Parkhurst cottage
              </div>
              <div style={{ fontSize: 16, color: C.muted }}>Ntokozo Dlamini · 5 min 18 s · WhatsApp call</div>

              <AppCard style={{ borderColor: `${C.blue}55` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <IconSpark size={20} color={C.blueLight} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.blueLight }}>AI Summary</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontFamily: MONO,
                      fontSize: 12,
                      color: C.muted,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '3px 8px',
                    }}
                  >
                    muse-spark-1.3
                  </span>
                </div>
                {thinking ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.text2, fontSize: 17 }}>
                    <Spinner size={20} color={C.blueLight} /> Drafting minutes…
                  </div>
                ) : (
                  <div style={{ fontSize: 17, lineHeight: 1.5, color: C.text2, minHeight: 130 }}>
                    {text}
                    {f < 70 + (SUMMARY.length / 55) * 30 && f >= 70 ? (
                      <span style={{ color: C.blueLight, opacity: Math.round(f / 8) % 2 }}>▍</span>
                    ) : null}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, opacity: t(f, 200, 220) }}>
                  {['Plumbing', 'Quote', 'Site visit'].map((x) => (
                    <span
                      key={x}
                      style={{ fontSize: 14, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: C.text2 }}
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </AppCard>

              <SectionTitle>Decisions & agreements</SectionTitle>
              <AppCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Agreement', 'Replace hot-water runs with copper, ≈ R8 500 incl. labour', C.blueLight],
                  ['Commitment', 'Phone before any work beyond the quote', C.blueLight],
                  ['Unresolved', 'Ntokozo to confirm after speaking to his wife', C.muted],
                ].map(([k, v, col], i) => {
                  const p = t(f, 300 + i * 20, 330 + i * 20);
                  return (
                    <div key={k} style={{ display: 'flex', gap: 12, opacity: p, transform: `translateX(${(1 - p) * 20}px)` }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: col, marginTop: 8 }} />
                      <div>
                        <div style={{ fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{k}</div>
                        <div style={{ fontSize: 17, color: C.text2, lineHeight: 1.4 }}>{v}</div>
                      </div>
                    </div>
                  );
                })}
              </AppCard>

              <SectionTitle>Action items</SectionTitle>
              <AppCard style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['Send the written quote for the Parkhurst cottage piping', 'Thandi', 500],
                  ['Book Sipho for the site visit on Thursday at 08:00', 'Thandi', 540],
                ].map(([txt, who, at]) => {
                  const k = tick(at as number);
                  return (
                    <div key={txt as string} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          flexShrink: 0,
                          border: `2px solid ${k > 0.5 ? C.green : C.muted}`,
                          background: k > 0.5 ? C.green : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: `scale(${1 + Math.sin(k * Math.PI) * 0.25})`,
                        }}
                      >
                        {k > 0.5 ? <IconCheck size={18} color="#000" stroke={3} /> : null}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 17,
                            color: k > 0.5 ? C.muted : C.text,
                            textDecoration: k > 0.5 ? 'line-through' : 'none',
                          }}
                        >
                          {txt}
                        </div>
                        <div style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>{who}</div>
                      </div>
                    </div>
                  );
                })}
              </AppCard>

              <SectionTitle>Full transcript · Speaker ID</SectionTitle>
              {SEGMENTS.map(([who, txt], i) => (
                <AppCard key={i} style={{ padding: 14 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: who === 'Business' ? `${C.blue}26` : `${C.green}26`,
                      color: who === 'Business' ? C.blueLight : C.green,
                    }}
                  >
                    {who}
                  </span>
                  <div style={{ fontSize: 16, lineHeight: 1.45, marginTop: 8 }}>{txt}</div>
                </AppCard>
              ))}
            </div>
          </Phone>
        }
      />
    </Scene>
  );
};

/* ───────────────────────── Search ───────────────────────── */

const Highlight: React.FC<{ text: string; q: string }> = ({ text, q }) => {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: `${C.amber}55`, color: C.text, borderRadius: 4, padding: '0 2px' }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
};

export const Search: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const q = typed('geyser', f, 50, 8);
  const show = t(f, 100, 125);
  return (
    <Scene dur={dur}>
      <Split
        n="05"
        chapter="Searchable memory"
        heading={
          <>
            “What did we agree
            <br />
            <span style={{ color: C.text2 }}>about the geyser?”</span>
          </>
        }
        bullets={[
          { at: 40, title: 'Search every call', body: 'Titles, minutes and the full transcript text.' },
          { at: 130, title: 'Back in seconds', body: 'From a vague memory to the exact words that were said.' },
        ]}
        phone={
          <Phone overlay={<TabBar active={2} />}>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>Search</div>
              <AppCard style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                <IconSearch size={22} color={C.muted} />
                <span style={{ fontSize: 20 }}>
                  {q}
                  <span style={{ color: C.blueLight, opacity: Math.round(f / 8) % 2 }}>|</span>
                </span>
              </AppCard>
              <div style={{ fontSize: 15, color: C.muted, opacity: show }}>2 calls match</div>
              {[
                [
                  'Emergency — burst geyser in Midrand unit',
                  'Thandiwe phoned early with a burst geyser flooding the passage of her Midrand unit…',
                ],
                [
                  'Supplier pricing for geysers — Steyn Wholesale',
                  'Annual price discussion with Johan at Steyn Wholesale. He proposed a 9 percent increase…',
                ],
              ].map(([title, body], i) => {
                const p = t(f, 105 + i * 14, 135 + i * 14);
                return (
                  <AppCard key={title} style={{ opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
                    <div style={{ fontSize: 18, fontWeight: 650 }}>
                      <Highlight text={title} q={q} />
                    </div>
                    <div style={{ fontSize: 15, color: C.text2, marginTop: 6, lineHeight: 1.45 }}>
                      <Highlight text={body} q={q} />
                    </div>
                  </AppCard>
                );
              })}
            </div>
          </Phone>
        }
      />
    </Scene>
  );
};

/* ───────────────────────── Failure honesty ───────────────────────── */

export const Failure: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const loading = f >= 140;
  return (
    <Scene dur={dur}>
      <Split
        n="06"
        chapter="Honest by default"
        heading={
          <>
            When something fails,
            <br />
            <span style={{ color: C.text2 }}>we say so.</span>
          </>
        }
        bullets={[
          {
            at: 30,
            title: 'Visible, never silent',
            body: 'A call that quietly vanishes is worse than an error you can act on.',
          },
          {
            at: 140,
            title: 'One-tap retry',
            body: 'Re-fetches the transcript from Meta while it is still within the 7-day window.',
          },
        ]}
        phone={
          <Phone overlay={<Tap x={221} y={408} at={132} />}>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 18, color: C.blueLight }}>← Calls</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>WhatsApp call</div>
              <div style={{ fontSize: 16, color: C.muted }}>Khaya Property Services</div>
              <AppCard style={{ borderColor: `${C.red}55`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IconAlert size={22} color={C.red} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.red }}>Transcript unavailable</span>
                </div>
                <div style={{ fontSize: 16, color: C.text2, lineHeight: 1.5 }}>
                  This call was transcribed by WhatsApp, but the transcript could not be downloaded
                  or verified. WhatsApp keeps transcripts for 7 days after the call.
                </div>
                <div
                  style={{
                    height: 54,
                    borderRadius: 14,
                    background: C.blue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    fontSize: 18,
                    fontWeight: 700,
                    opacity: loading ? 0.7 : 1,
                    transform: `scale(${f >= 132 && f < 142 ? 0.96 : 1})`,
                  }}
                >
                  {loading ? (
                    <Spinner size={22} />
                  ) : (
                    <>
                      <IconRefresh size={20} color="#fff" /> Retry download
                    </>
                  )}
                </div>
              </AppCard>
            </div>
          </Phone>
        }
      />
    </Scene>
  );
};
