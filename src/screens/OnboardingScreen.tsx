import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassCard } from '../components/GlassCard';
import { StackScreenLayout } from '../components/StackScreenLayout';
import { MeetingProMark } from '../components/MeetingProMark';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND, SPACING } from '../constants/theme';
import { COMPANY, PRODUCT } from '../constants/brand';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const STEPS = [
  {
    icon: 'people' as const,
    title: 'Business contacts',
    description: 'Save the people you work with on WhatsApp.',
  },
  {
    icon: 'call' as const,
    title: 'Automatic transcription',
    description: 'When a Business call ends, Meeting Pro captures the conversation.',
  },
  {
    icon: 'mail' as const,
    title: 'Minutes to your inbox',
    description: 'AI summary and action items — share with clients like formal minutes.',
  },
  {
    icon: 'grid' as const,
    title: 'Dashboard metrics',
    description: 'Answer rates, call length, and outcomes at a glance.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];

  return (
    <StackScreenLayout contentStyle={styles.scrollBody}>
      <View style={styles.hero}>
        <MeetingProMark size={88} framed />
        <Text style={[styles.brand, { color: palette.textMuted }]}>{COMPANY.name}</Text>
        <Text style={[styles.headline, { color: palette.text }]}>{PRODUCT.name}</Text>
        <Text style={[styles.sub, { color: palette.textSecondary }]}>
          {PRODUCT.tagline} — transcribe calls, track contacts, email minutes, and search every
          conversation on your Business line.
        </Text>
      </View>

      <View style={styles.features}>
        {STEPS.map((f) => (
          <GlassCard key={f.title} style={styles.featureCard}>
            <Ionicons name={f.icon} size={22} color={BRAND.accent} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: palette.text }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: palette.textSecondary }]}>
                {f.description}
              </Text>
            </View>
          </GlassCard>
        ))}
      </View>

      <Pressable
        style={[styles.cta, { backgroundColor: BRAND.accent }]}
        onPress={() => navigation.replace('Main')}
        accessibilityRole="button"
        accessibilityLabel="Open dashboard"
      >
        <Text style={styles.ctaText}>Open dashboard</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </Pressable>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollBody: {
    gap: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  hero: { alignItems: 'center', gap: SPACING.sm },
  brand: {
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  headline: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: FONT.base, textAlign: 'center', lineHeight: 22, maxWidth: 340 },
  features: { gap: SPACING.sm },
  featureCard: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: FONT.base, fontWeight: '700' },
  featureDesc: { fontSize: FONT.sm, marginTop: 4, lineHeight: 20 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
  },
  ctaText: { color: '#FFF', fontSize: FONT.base, fontWeight: '800' },
});
