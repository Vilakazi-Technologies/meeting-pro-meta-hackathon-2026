import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/GlassCard';
import { StackScreenLayout } from '../components/StackScreenLayout';
import { MeetingProMark } from '../components/MeetingProMark';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { COLORS, FONT, RADIUS, BRAND, SPACING } from '../constants/theme';
import { PRODUCT } from '../constants/brand';

type Props = {
  onConnect: () => void;
};

const DEMO_POINTS = [
  'A property-services business with two weeks of WhatsApp calls',
  'AI minutes, decisions, follow-ups and action items per call',
  'Search every conversation, contacts and call metrics',
];

/** First screen for a signed-in user who has no business yet. */
export function WelcomeScreen({ onConnect }: Props) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { signOut } = useAuth();
  const { enterDemo, error } = useWorkspace();
  const [entering, setEntering] = useState(false);

  const onExplore = async () => {
    setEntering(true);
    await enterDemo();
    setEntering(false);
  };

  return (
    <StackScreenLayout contentStyle={styles.body}>
      <View style={styles.hero}>
        <MeetingProMark size={80} framed />
        <Text style={[styles.headline, { color: palette.text }]}>Welcome to {PRODUCT.name}</Text>
        <Text style={[styles.sub, { color: palette.textSecondary }]}>
          Every WhatsApp Business call, turned into minutes, decisions and follow-ups your clients
          can sign off on.
        </Text>
      </View>

      <GlassCard style={styles.option}>
        <View style={styles.optionHead}>
          <Ionicons name="sparkles" size={22} color={BRAND.accent} />
          <Text style={[styles.optionTitle, { color: palette.text }]}>See it working first</Text>
        </View>
        {DEMO_POINTS.map((p) => (
          <View key={p} style={styles.point}>
            <Ionicons name="checkmark" size={16} color={palette.success} />
            <Text style={[styles.pointText, { color: palette.textSecondary }]}>{p}</Text>
          </View>
        ))}
        <Pressable
          style={[styles.cta, { backgroundColor: BRAND.accent }, entering && styles.ctaBusy]}
          onPress={() => void onExplore()}
          disabled={entering}
          accessibilityRole="button"
          accessibilityLabel="Explore the demo business"
        >
          {entering ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.ctaText}>Explore the demo business</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </Pressable>
        <Text style={[styles.note, { color: palette.textMuted }]}>
          Read-only sample data. You can leave the demo at any time.
        </Text>
      </GlassCard>

      <GlassCard style={styles.option}>
        <View style={styles.optionHead}>
          <Ionicons name="logo-whatsapp" size={22} color={palette.success} />
          <Text style={[styles.optionTitle, { color: palette.text }]}>Use my own number</Text>
        </View>
        <Text style={[styles.pointText, { color: palette.textSecondary }]}>
          Link a WhatsApp Cloud API number with calling enabled. Calls on that line become
          transcripts in your workspace.
        </Text>
        <Pressable
          style={[styles.secondary, { borderColor: palette.separator }]}
          onPress={onConnect}
          accessibilityRole="button"
          accessibilityLabel="Connect my WhatsApp number"
        >
          <Text style={[styles.secondaryText, { color: palette.text }]}>
            Connect my WhatsApp number
          </Text>
        </Pressable>
      </GlassCard>

      {error ? <Text style={[styles.error, { color: palette.error }]}>{error}</Text> : null}

      <Pressable onPress={() => void signOut()} accessibilityRole="button" style={styles.signOut}>
        <Text style={[styles.note, { color: palette.textMuted }]}>Sign out</Text>
      </Pressable>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: { gap: SPACING.lg, paddingTop: SPACING.xl },
  hero: { alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  headline: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: SPACING.sm },
  sub: { fontSize: FONT.base, textAlign: 'center', lineHeight: 22, maxWidth: 360 },
  option: { gap: SPACING.sm },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  optionTitle: { fontSize: FONT.lg, fontWeight: '700' },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  pointText: { flex: 1, fontSize: FONT.sm, lineHeight: 20 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    minHeight: 52,
  },
  ctaBusy: { opacity: 0.8 },
  ctaText: { color: '#FFF', fontSize: FONT.base, fontWeight: '800' },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  secondaryText: { fontSize: FONT.base, fontWeight: '700' },
  note: { fontSize: FONT.xs, textAlign: 'center', lineHeight: 18 },
  error: { fontSize: FONT.sm, textAlign: 'center' },
  signOut: { alignSelf: 'center', padding: SPACING.sm },
});
