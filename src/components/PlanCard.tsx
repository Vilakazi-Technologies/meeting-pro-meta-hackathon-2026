import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { usePlan, type Plan } from '../data/billing';
import { COLORS, FONT, RADIUS, BRAND, SPACING } from '../constants/theme';

function Meter({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = Math.min(1, limit > 0 ? used / limit : 0);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

function describe(plan: Plan): { title: string; detail: string } {
  if (plan.plan === 'paid') {
    const renews = plan.periodEnd
      ? new Date(plan.periodEnd).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
      : null;
    const state =
      plan.status === 'non_renewing'
        ? `Cancelled. Access until ${renews ?? 'period end'}.`
        : plan.status === 'attention'
          ? 'Your last payment failed. Update your card to keep minutes coming.'
          : renews
            ? `Renews ${renews}.`
            : 'Active.';
    return { title: 'Meeting Pro · R50/month', detail: state };
  }
  const left = Math.max(0, plan.freeLimit - plan.freeUsed);
  return {
    title: 'Free plan',
    detail:
      left > 0
        ? `${left} of ${plan.freeLimit} free transcribed calls left.`
        : 'Free calls used. Calls are still answered, but not transcribed.',
  };
}

/** Plan, usage, and the Paystack subscribe / manage buttons. */
export function PlanCard({ email }: { email: string | null | undefined }) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { plan, loading, busy, error, reload, subscribe, manage } = usePlan();

  // Paystack sends people back with ?billing=return; the webhook may land a
  // moment later, so look again a few times.
  useEffect(() => {
    if (Platform.OS !== 'web' || !window.location.search.includes('billing=return')) return;
    const timers = [2000, 5000, 10000].map((ms) => setTimeout(reload, ms));
    window.history.replaceState(null, '', window.location.pathname);
    return () => timers.forEach(clearTimeout);
  }, [reload]);

  if (loading) {
    return (
      <GlassCard style={styles.card}>
        <ActivityIndicator color={BRAND.accent} />
      </GlassCard>
    );
  }
  if (!plan) return null;

  const { title, detail } = describe(plan);
  const paid = plan.plan === 'paid';

  return (
    <GlassCard style={styles.card}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text
        style={[
          styles.detail,
          { color: plan.canTranscribe ? palette.textSecondary : '#F59E0B' },
        ]}
      >
        {detail}
      </Text>

      {paid ? (
        <View style={styles.meters}>
          <Text style={[styles.meterLabel, { color: palette.textMuted }]}>
            {plan.periodCallsUsed} of {plan.periodCallLimit} calls this month
          </Text>
          <Meter used={plan.periodCallsUsed} limit={plan.periodCallLimit} color={BRAND.accent} />
          <Text style={[styles.meterLabel, { color: palette.textMuted }]}>
            {plan.periodMinutesUsed} of {plan.periodMinuteLimit} minutes
          </Text>
          <Meter used={plan.periodMinutesUsed} limit={plan.periodMinuteLimit} color={BRAND.accent} />
        </View>
      ) : (
        <View style={styles.meters}>
          <Meter used={plan.freeUsed} limit={plan.freeLimit} color={BRAND.accent} />
          <Text style={[styles.pitch, { color: palette.textSecondary }]}>
            R50/month: up to 30 calls or 300 minutes of minutes, decisions and action items.
          </Text>
        </View>
      )}

      {error ? <Text style={[styles.error, { color: palette.error }]}>{error}</Text> : null}

      <Pressable
        style={[
          styles.button,
          paid
            ? { borderWidth: 1, borderColor: palette.separator }
            : { backgroundColor: BRAND.accent },
          busy && styles.busy,
        ]}
        onPress={() => void (paid ? manage() : subscribe(email))}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color={paid ? palette.text : '#FFF'} />
        ) : (
          <Text style={[styles.buttonText, { color: paid ? palette.text : '#FFF' }]}>
            {paid ? 'Manage subscription' : 'Subscribe · R50/month'}
          </Text>
        )}
      </Pressable>
      {!paid ? (
        <Text style={[styles.fine, { color: palette.textMuted }]}>
          Secure card payment by Paystack. Cancel any time.
        </Text>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.sm, marginBottom: 20 },
  title: { fontSize: FONT.lg, fontWeight: '700' },
  detail: { fontSize: FONT.sm, lineHeight: 20 },
  meters: { gap: 6, marginTop: 4 },
  meterLabel: { fontSize: FONT.xs },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.25)', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  pitch: { fontSize: FONT.sm, lineHeight: 20, marginTop: 4 },
  error: { fontSize: FONT.sm },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    minHeight: 50,
  },
  busy: { opacity: 0.8 },
  buttonText: { fontSize: FONT.base, fontWeight: '800' },
  fine: { fontSize: FONT.xs, textAlign: 'center' },
});
