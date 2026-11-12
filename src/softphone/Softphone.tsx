// Browser softphone: rings when a customer calls the business's WhatsApp
// number, answers through call-control, and hangs up.
//
// Meta gives the business 30-60 seconds to answer, so a ringing call reaches
// the browser two ways: Realtime for speed, and a short poll in case the socket
// is down. Either path only shows calls created in the last RING_WINDOW_MS.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from '../contexts/SupabaseContext';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { formatPhoneNumber } from '../data/businessProfile';
import { answerOffer, openMicrophone, softphoneSupported, startRingtone, type CallLeg } from './webrtc';

const RING_WINDOW_MS = 75_000;
const POLL_MS = 3_000;

interface RingingCall {
  id: string;
  sdp_offer: string;
  counterparty_name: string | null;
  counterparty_phone: string | null;
  created_at: string;
  ring_state: string | null;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'ringing'; call: RingingCall }
  | { kind: 'connecting'; call: RingingCall }
  | {
      kind: 'connected';
      call: RingingCall;
      since: number;
      muted: boolean;
      transcribed: boolean;
      reason: string | null;
    }
  | { kind: 'ended'; message: string };

const CALL_COLUMNS = 'id, sdp_offer, counterparty_name, counterparty_phone, created_at, ring_state';

function isFreshRinging(row: Partial<RingingCall> | null | undefined): row is RingingCall {
  return (
    !!row?.id &&
    row.ring_state === 'ringing' &&
    !!row.sdp_offer &&
    !!row.created_at &&
    Date.now() - new Date(row.created_at).getTime() < RING_WINDOW_MS
  );
}

function callerLabel(call: RingingCall): string {
  if (call.counterparty_name) return call.counterparty_name;
  if (call.counterparty_phone) return formatPhoneNumber(call.counterparty_phone);
  return 'WhatsApp caller';
}

interface ControlResult {
  error: string | null;
  transcribed?: boolean;
  reason?: string | null;
}

async function controlCall(
  supabase: SupabaseClient,
  callId: string,
  action: 'accept' | 'reject' | 'terminate',
  sdp?: string
): Promise<ControlResult> {
  const { data, error } = await supabase.functions.invoke('call-control', {
    body: { call_id: callId, action, sdp },
  });
  if (!error) return { error: null, transcribed: data?.transcribed, reason: data?.reason ?? null };
  const context = (error as { context?: Response }).context;
  try {
    const body = await context?.json();
    if (body?.error) return { error: String(body.error) };
  } catch {
    /* fall through */
  }
  return { error: error.message };
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Mounted once for signed-in members on web. Renders nothing until a call rings. */
export function Softphone() {
  // calls.sdp_offer / ring_state post-date the generated Database types.
  const supabase = useSupabase() as unknown as SupabaseClient;
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const legRef = useRef<CallLeg | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const finish = useCallback((message: string) => {
    legRef.current?.close();
    legRef.current = null;
    setPhase({ kind: 'ended', message });
    setTimeout(() => {
      if (phaseRef.current.kind === 'ended') setPhase({ kind: 'idle' });
    }, 3500);
  }, []);

  const onRow = useCallback(
    (row: Partial<RingingCall>) => {
      const current = phaseRef.current;
      const activeId =
        current.kind === 'ringing' || current.kind === 'connecting' || current.kind === 'connected'
          ? current.call.id
          : null;
      if (activeId && row.id === activeId) {
        if (row.ring_state === 'ended') {
          finish(current.kind === 'connected' ? 'Call ended. Minutes will follow shortly.' : 'Missed call');
        } else if (current.kind === 'ringing' && row.ring_state && row.ring_state !== 'ringing') {
          // Someone else on the team picked it up.
          setPhase({ kind: 'idle' });
        }
        return;
      }
      if (!activeId && isFreshRinging(row)) {
        setError(null);
        setPhase({ kind: 'ringing', call: row });
      }
    },
    [finish]
  );

  useEffect(() => {
    if (!softphoneSupported()) return;
    const channel = supabase
      .channel('softphone-calls')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls' },
        (payload) => onRow(payload.new as Partial<RingingCall>)
      )
      .subscribe();

    const poll = async () => {
      const current = phaseRef.current;
      if (current.kind === 'ringing' || current.kind === 'connecting' || current.kind === 'connected') {
        const { data } = await supabase.from('calls').select(CALL_COLUMNS).eq('id', current.call.id).maybeSingle();
        if (data) onRow(data as Partial<RingingCall>);
        return;
      }
      const since = new Date(Date.now() - RING_WINDOW_MS).toISOString();
      const { data } = await supabase
        .from('calls')
        .select(CALL_COLUMNS)
        .eq('ring_state', 'ringing')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]) onRow(data[0] as Partial<RingingCall>);
    };
    const interval = setInterval(() => void poll(), POLL_MS);
    void poll();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [supabase, onRow]);

  // Ring, and stop ringing when Meta's window closes without an answer.
  useEffect(() => {
    if (phase.kind !== 'ringing') return;
    const stopRing = startRingtone();
    const title = document.title;
    document.title = `Incoming call: ${callerLabel(phase.call)}`;
    const age = Date.now() - new Date(phase.call.created_at).getTime();
    const expire = setTimeout(() => finish('Missed call'), Math.max(0, RING_WINDOW_MS - age));
    return () => {
      stopRing();
      clearTimeout(expire);
      document.title = title;
    };
  }, [phase, finish]);

  // Call timer.
  useEffect(() => {
    if (phase.kind !== 'connected') return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [phase.kind]);

  // Never leave a live leg behind if the app unmounts mid-call.
  useEffect(() => () => legRef.current?.close(), []);

  const answer = async () => {
    if (phase.kind !== 'ringing') return;
    const call = phase.call;
    setError(null);
    setPhase({ kind: 'connecting', call });
    let leg: CallLeg | null = null;
    try {
      const mic = await openMicrophone();
      leg = await answerOffer(call.sdp_offer, mic);
    } catch (err) {
      leg?.close();
      const denied = err instanceof DOMException && err.name === 'NotAllowedError';
      setError(denied ? 'Allow microphone access to answer calls.' : 'Could not start the call audio.');
      setPhase({ kind: 'ringing', call });
      return;
    }
    const accepted = await controlCall(supabase, call.id, 'accept', leg.answerSdp);
    if (accepted.error) {
      leg.close();
      finish(accepted.error);
      return;
    }
    legRef.current = leg;
    leg.onStateChange((state) => {
      if (state === 'failed') {
        void controlCall(supabase, call.id, 'terminate');
        finish('The call connection dropped.');
      }
    });
    setPhase({
      kind: 'connected',
      call,
      since: Date.now(),
      muted: false,
      transcribed: accepted.transcribed !== false,
      reason: accepted.reason ?? null,
    });
  };

  const decline = async () => {
    if (phase.kind !== 'ringing') return;
    const id = phase.call.id;
    setPhase({ kind: 'idle' });
    await controlCall(supabase, id, 'reject');
  };

  const hangUp = async () => {
    if (phase.kind !== 'connected') return;
    const id = phase.call.id;
    finish(phase.transcribed ? 'Call ended. Minutes will follow shortly.' : 'Call ended.');
    await controlCall(supabase, id, 'terminate');
  };

  const toggleMute = () => {
    if (phase.kind !== 'connected') return;
    const muted = !phase.muted;
    legRef.current?.setMuted(muted);
    setPhase({ ...phase, muted });
  };

  if (phase.kind === 'idle') return null;

  if (phase.kind === 'ended') {
    return (
      <View style={styles.toastWrap} pointerEvents="none">
        <View style={[styles.toast, { backgroundColor: palette.glassFill, borderColor: palette.separator }]}>
          <Ionicons name="call" size={16} color={palette.textMuted} />
          <Text style={[styles.toastText, { color: palette.text }]}>{phase.message}</Text>
        </View>
      </View>
    );
  }

  const call = phase.call;
  const subtitle =
    phase.kind === 'ringing'
      ? 'Incoming WhatsApp call'
      : phase.kind === 'connecting'
        ? 'Connecting…'
        : formatDuration(Date.now() - phase.since);

  return (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <View style={[styles.card, { backgroundColor: effectiveTheme === 'dark' ? '#111827' : '#FFFFFF' }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{callerLabel(call).slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
          {callerLabel(call)}
        </Text>
        {call.counterparty_name && call.counterparty_phone ? (
          <Text style={[styles.phone, { color: palette.textMuted }]}>
            {formatPhoneNumber(call.counterparty_phone)}
          </Text>
        ) : null}
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>

        {phase.kind === 'connected' ? (
          <Text
            style={[styles.note, { color: phase.transcribed ? palette.textMuted : '#F59E0B' }]}
          >
            {phase.transcribed
              ? 'Transcription is on. WhatsApp told both of you before it started.'
              : `Not transcribed. ${phase.reason ?? ''}`.trim()}
          </Text>
        ) : null}
        {error ? <Text style={[styles.note, { color: palette.error }]}>{error}</Text> : null}

        <View style={styles.actions}>
          {phase.kind === 'ringing' ? (
            <>
              <RoundButton icon="close" color="#EF4444" label="Decline" onPress={() => void decline()} />
              <RoundButton icon="call" color="#22C55E" label="Answer" onPress={() => void answer()} />
            </>
          ) : phase.kind === 'connecting' ? (
            <ActivityIndicator size="large" color="#22C55E" />
          ) : (
            <>
              <RoundButton
                icon={phase.muted ? 'mic-off' : 'mic'}
                color={phase.muted ? '#F59E0B' : '#64748B'}
                label={phase.muted ? 'Unmute' : 'Mute'}
                onPress={toggleMute}
              />
              <RoundButton icon="call" color="#EF4444" label="End" onPress={() => void hangUp()} rotate />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function RoundButton({
  icon,
  color,
  label,
  onPress,
  rotate,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
  onPress: () => void;
  rotate?: boolean;
}) {
  return (
    <View style={styles.buttonCol}>
      <Pressable
        onPress={onPress}
        style={[styles.round, { backgroundColor: color }]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons
          name={icon}
          size={28}
          color="#FFF"
          style={rotate ? { transform: [{ rotate: '135deg' }] } : undefined}
        />
      </Pressable>
      <Text style={styles.buttonLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2,6,23,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    zIndex: 1000,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: { color: '#FFF', fontSize: 34, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  phone: { fontSize: FONT.sm },
  subtitle: { fontSize: FONT.base, fontWeight: '600' },
  note: { fontSize: FONT.xs, textAlign: 'center', lineHeight: 18, marginTop: SPACING.xs },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl * 1.5,
    marginTop: SPACING.lg,
    minHeight: 90,
    alignItems: 'center',
  },
  buttonCol: { alignItems: 'center', gap: 6 },
  round: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { color: '#94A3B8', fontSize: FONT.xs, fontWeight: '600' },
  toastWrap: { position: 'absolute', top: 24, left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toastText: { fontSize: FONT.sm, fontWeight: '600' },
});
