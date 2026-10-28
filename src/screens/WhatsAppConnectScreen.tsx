import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { GlassPrimaryButton } from '../components/GlassPrimaryButton';
import { MeetingProMark } from '../components/MeetingProMark';
import { StackScreenLayout } from '../components/StackScreenLayout';
import { Surface } from '../components/Surface';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND } from '../constants/theme';
import { TYPO } from '../constants/typography';
import { RootStackParamList } from '../types';
import { useBusinessProfile, formatPhoneNumber } from '../data/businessProfile';
import { useRegisterWhatsAppNumber } from '../data/whatsappRegistration';
import { DATA_SOURCE } from '../lib/supabaseConfig';
import { getMetaHackathonDefaults } from '../lib/metaHackathonEnv';

const metaDefaults = getMetaHackathonDefaults();

type Props = NativeStackScreenProps<RootStackParamList, 'WhatsAppConnect'>;

export function WhatsAppConnectScreen({ navigation }: Props) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const profile = useBusinessProfile();
  const { register, submitting } = useRegisterWhatsAppNumber();

  const [displayPhone, setDisplayPhone] = useState(metaDefaults.displayPhone);
  const [phoneNumberId, setPhoneNumberId] = useState(metaDefaults.phoneNumberId);
  const [wabaId, setWabaId] = useState(metaDefaults.wabaId);
  const [businessName, setBusinessName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const steps = [
    'Get WABA + Phone number ID (Meta Social Technologies MCP or WhatsApp → API Setup)',
    'Use the same number you enabled for Cloud API calling + transcription',
    'Meta sends finished transcripts to your Supabase webhook — they appear in Minutes',
  ];

  const onSubmit = async () => {
    setFormError(null);
    setFormSuccess(null);
    const result = await register({
      displayPhone,
      phoneNumberId,
      wabaId,
      businessName: businessName || profile.businessName || undefined,
    });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    profile.reload();
    setFormSuccess('Number linked. Calls on this line will route to your workspace.');
    if (DATA_SOURCE === 'mock') {
      setTimeout(() => navigation.goBack(), 800);
    }
  };

  return (
    <StackScreenLayout
      fullBleedHeader={
        <Pressable onPress={() => navigation.goBack()} style={styles.back} accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </Pressable>
      }
    >
      <View style={styles.iconWrap}>
        <MeetingProMark size={72} framed />
      </View>

      <Text style={[styles.title, { color: palette.text }]}>WhatsApp Business</Text>
      <Text style={[styles.desc, { color: palette.textSecondary }]}>
        Link your Meta Cloud API number so Meeting Pro knows which Business line belongs to your
        VILATECH workspace.
      </Text>

      <Surface style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons
            name={
              profile.loading
                ? 'ellipsis-horizontal-circle'
                : profile.connected
                  ? 'checkmark-circle'
                  : 'alert-circle'
            }
            size={24}
            color={
              profile.loading
                ? palette.textMuted
                : profile.connected
                  ? palette.success
                  : palette.textMuted
            }
          />
          <View style={styles.statusTextBlock}>
            <Text style={[styles.statusTitle, { color: palette.text }]}>
              {profile.loading
                ? 'Checking…'
                : profile.error
                  ? 'Status unavailable'
                  : profile.connected
                    ? 'Connected'
                    : 'Not connected'}
            </Text>
            <Text style={[styles.statusSub, { color: palette.textMuted }]}>
              {profile.loading
                ? ''
                : profile.error
                  ? profile.error
                  : profile.connected
                    ? `${profile.businessName ?? 'Workspace'} · ${formatPhoneNumber(
                        profile.number!.displayPhoneNumber
                      )}`
                    : 'Add your Cloud API number below to start the demo.'}
            </Text>
          </View>
        </View>
      </Surface>

      <Surface style={styles.formBlock}>
        <Text style={[TYPO.headline, { color: palette.text }]}>Link a number</Text>
        <Text style={[TYPO.footnote, styles.formHint, { color: palette.textMuted }]}>
          From Meta API Setup: Phone number ID, WABA ID, and the display number (E.164).
        </Text>

        <GlassInput
          label="Business name (optional)"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder={profile.businessName ?? 'VILATECH workspace'}
          editable={!submitting}
        />
        <GlassInput
          label="Display phone (E.164)"
          value={displayPhone}
          onChangeText={setDisplayPhone}
          placeholder="27123456789"
          keyboardType="phone-pad"
          autoComplete="tel"
          editable={!submitting}
        />
        <GlassInput
          label="Phone number ID"
          value={phoneNumberId}
          onChangeText={setPhoneNumberId}
          placeholder="From Meta API Setup"
          autoCapitalize="none"
          editable={!submitting}
        />
        <GlassInput
          label="WhatsApp Business Account ID (WABA)"
          value={wabaId}
          onChangeText={setWabaId}
          placeholder="From Meta API Setup"
          autoCapitalize="none"
          editable={!submitting}
        />

        {formError ? (
          <Text style={[styles.formMessage, { color: palette.error }]}>{formError}</Text>
        ) : null}
        {formSuccess ? (
          <Text style={[styles.formMessage, { color: palette.success }]}>{formSuccess}</Text>
        ) : null}

        <GlassPrimaryButton
          label={profile.connected ? 'Update linked number' : 'Connect number'}
          onPress={() => void onSubmit()}
          loading={submitting}
          disabled={
            submitting ||
            displayPhone.trim().length < 8 ||
            !phoneNumberId.trim() ||
            !wabaId.trim()
          }
        />
      </Surface>

      <View style={styles.steps}>
        {steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: `${BRAND.accent}22` }]}>
              <Text style={[styles.stepNumText, { color: BRAND.accent }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: palette.textSecondary }]}>{step}</Text>
          </View>
        ))}
      </View>

      {DATA_SOURCE === 'supabase' ? (
        <Text style={[styles.buttonNote, { color: palette.textMuted }]}>
          Run migration `20261027120000_register_whatsapp_number.sql` on your Supabase project once.
          Meta webhook + `META_ACCESS_TOKEN` must still be set for live transcripts.
        </Text>
      ) : null}
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  back: { padding: 20, paddingBottom: 8 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { ...TYPO.title2, textAlign: 'center' },
  desc: {
    ...TYPO.callout,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  statusCard: { marginBottom: 14 },
  formBlock: { marginBottom: 20, gap: 12 },
  formHint: { marginBottom: 4, lineHeight: 18 },
  formMessage: { ...TYPO.footnote, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusTextBlock: { flex: 1, minWidth: 0 },
  buttonNote: { fontSize: FONT.sm, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  statusTitle: { fontSize: FONT.lg, fontWeight: '600' },
  statusSub: { fontSize: FONT.sm, marginTop: 2, flexWrap: 'wrap' },
  steps: { gap: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: FONT.sm, fontWeight: '700' },
  stepText: { flex: 1, fontSize: FONT.base, lineHeight: 22 },
});
