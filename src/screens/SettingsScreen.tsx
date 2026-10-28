import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabScreenLayout } from '../components/TabScreenLayout';
import { GlassCard } from '../components/GlassCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessProfile, formatPhoneNumber } from '../data/businessProfile';
import { COLORS, FONT, RADIUS, BRAND, ThemePalette } from '../constants/theme';
import { TYPO } from '../constants/typography';
import { LAYOUT } from '../constants/layout';
import { MainTabParamList, RootStackParamList } from '../types';
import { getDeviceLabel, supportsLiquidGlass } from '../utils/platform';
import { useMeetingMinutesPrefs } from '../data/meetingMinutesPrefs';
import { GlassInput } from '../components/GlassInput';
import { ThemeModePicker } from '../components/ThemeModePicker';

type SettingsNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: SettingsNav };

export function SettingsScreen({ navigation }: Props) {
  const { effectiveTheme } = useTheme();
  const { email, signOut } = useAuth();
  const profile = useBusinessProfile();
  const minutes = useMeetingMinutesPrefs();
  const [emailDraft, setEmailDraft] = useState('');
  const palette = COLORS[effectiveTheme];
  React.useEffect(() => {
    if (minutes.overrideEmail != null) setEmailDraft(minutes.overrideEmail);
  }, [minutes.overrideEmail]);

  return (
    <TabScreenLayout>
          <ScreenHeader title="Settings" subtitle={profile.businessName ?? ''} />

          <GlassCard style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: `${BRAND.accent}33` }]}>
              <Text style={styles.avatarText}>LI</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.orgName, { color: palette.text }]}>
                {profile.businessName ?? (profile.loading ? 'Loading…' : 'Business')}
              </Text>
              <Text style={[styles.orgSub, { color: palette.textSecondary }]}>
                {profile.number
                  ? formatPhoneNumber(profile.number.displayPhoneNumber)
                  : profile.loading
                    ? ''
                    : 'No WhatsApp number connected'}
              </Text>
            </View>
            {/* The badge states the real connection status. It used to read
                "Connected" for everyone, whatever the account actually had. */}
            {!profile.loading && (
              <View
                style={[
                  styles.connectedBadge,
                  {
                    backgroundColor: profile.connected
                      ? `${BRAND.whatsapp}22`
                      : `${palette.textMuted}22`,
                  },
                ]}
              >
                <Ionicons
                  name="link-outline"
                  size={14}
                  color={profile.connected ? BRAND.accent : palette.textMuted}
                />
                <Text
                  style={[
                    styles.connectedText,
                    { color: profile.connected ? BRAND.accent : palette.textMuted },
                  ]}
                >
                  {profile.connected ? 'Connected' : 'Not connected'}
                </Text>
              </View>
            )}
          </GlassCard>
          {profile.error ? (
            <Text style={[styles.profileError, { color: palette.error }]}>{profile.error}</Text>
          ) : null}

          <Text style={[styles.section, { color: palette.textMuted }]}>Appearance</Text>
          <GlassCard style={styles.menuCard}>
            <Text style={[styles.appearanceHint, { color: palette.textSecondary }]}>
              Theme — trust green and quality blue accents stay consistent in both modes.
            </Text>
            <ThemeModePicker />
            <Divider palette={palette} />
            <SettingRow
              icon="phone-portrait-outline"
              label="Device & OS"
              value={getDeviceLabel()}
              palette={palette}
            />
            {supportsLiquidGlass() && (
              <>
                <Divider palette={palette} />
                <SettingRow
                  icon="color-wand"
                  label="Liquid Glass UI"
                  value="Active (iOS 26+)"
                  palette={palette}
                />
              </>
            )}
          </GlassCard>

          <Text style={[styles.section, { color: palette.textMuted }]}>Meeting minutes email</Text>
          <GlassCard style={styles.menuCard}>
            <SettingRow
              icon="mail-outline"
              label="Email after each call"
              palette={palette}
              trailing={
                <Switch
                  value={minutes.enabled}
                  disabled={minutes.loading}
                  onValueChange={async (v) => {
                    try {
                      await minutes.save({ enabled: v });
                    } catch {
                      /* prefs may fail until DB migration is applied */
                    }
                  }}
                  trackColor={{ false: '#CBD5E1', true: BRAND.accent }}
                />
              }
            />
            {minutes.enabled ? (
              <>
                <Divider palette={palette} />
                <View style={styles.emailOverride}>
                  <GlassInput
                    label="Send to (optional)"
                    value={emailDraft}
                    onChangeText={setEmailDraft}
                    placeholder={email ?? 'your@email.com'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={async () => {
                      try {
                        await minutes.save({
                          overrideEmail: emailDraft.trim() || null,
                        });
                      } catch {
                        /* ignore */
                      }
                    }}
                  />
                  <Text style={[styles.emailHint, { color: palette.textMuted }]}>
                    Leave blank to use your sign-in email. Minutes include summary, decisions, and
                    action items from WhatsApp Business calls on your linked line.
                  </Text>
                </View>
              </>
            ) : null}
          </GlassCard>

          <Text style={[styles.section, { color: palette.textMuted }]}>Integrations</Text>
          <GlassCard style={styles.menuCard}>
            <Pressable onPress={() => navigation.navigate('WhatsAppConnect')}>
              <SettingRow
                icon="link-outline"
                label="WhatsApp Business"
                value={profile.connected ? 'Connected' : 'Not connected'}
                palette={palette}
                showChevron
              />
            </Pressable>
            {/* "CRM Export — HubSpot" and "Web Dashboard —
                meetingpro.vilatech.co" sat here with chevrons and no handler.
                Neither exists; a row that does nothing when tapped is worse
                than no row. */}
          </GlassCard>

          <Text style={[styles.section, { color: palette.textMuted }]}>Account</Text>
          <GlassCard style={styles.menuCard}>
            <SettingRow
              icon="person-circle-outline"
              label="Signed in as"
              value={email ?? ''}
              palette={palette}
            />
            <Divider palette={palette} />
            {/* Signing out clears the stored session; the app returns to the
                sign-in screen on its own via AuthContext. */}
            <Pressable testID="settings-sign-out" accessibilityRole="button" onPress={signOut}>
              <SettingRow icon="log-out-outline" label="Sign out" palette={palette} />
            </Pressable>
          </GlassCard>

          <Text style={[styles.section, { color: palette.textMuted }]}>About</Text>
          <GlassCard style={styles.vilatechCard}>
            <Text style={[styles.vilatechTitle, { color: palette.text }]}>VILATECH</Text>
            <Text style={[styles.vilatechDesc, { color: palette.textSecondary }]}>
              Meeting Pro — WhatsApp Business call transcripts and AI meeting minutes
            </Text>
          </GlassCard>

          <Text style={[styles.version, { color: palette.textMuted }]}>
            Meeting Pro v1.0.0 · VILATECH
          </Text>

    </TabScreenLayout>
  );
}

function SettingRow({
  icon,
  label,
  value,
  palette,
  trailing,
  showChevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  palette: ThemePalette;
  trailing?: React.ReactNode;
  showChevron?: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <Ionicons name={icon} size={20} color={palette.textSecondary} />
      <Text style={[styles.settingLabel, { color: palette.text }]}>{label}</Text>
      {value && (
        <Text style={[styles.settingValue, { color: palette.textMuted }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {trailing}
      {showChevron && !trailing && (
        <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
      )}
    </View>
  );
}

function Divider({ palette }: { palette: ThemePalette }) {
  return <View style={[styles.divider, { backgroundColor: `${palette.textMuted}22` }]} />;
}

const styles = StyleSheet.create({
  profileError: { fontSize: FONT.sm, marginBottom: 12, lineHeight: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: LAYOUT.sectionGap,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FONT.lg, fontWeight: '700', color: BRAND.accent },
  profileInfo: { flex: 1 },
  orgName: { fontSize: FONT.lg, fontWeight: '700' },
  orgSub: { fontSize: FONT.sm, marginTop: 2 },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  connectedText: { fontSize: FONT.xs, fontWeight: '600' },
  section: {
    ...TYPO.eyebrow,
    marginBottom: 10,
    marginTop: 4,
  },
  menuCard: { marginBottom: LAYOUT.blockGap, paddingVertical: 6 },
  appearanceHint: {
    fontSize: FONT.sm,
    lineHeight: 20,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  emailOverride: { paddingHorizontal: 4, paddingBottom: 8 },
  emailHint: { fontSize: FONT.xs, lineHeight: 18, marginTop: 6 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingLabel: { flex: 1, fontSize: FONT.base, fontWeight: '500' },
  settingValue: { fontSize: FONT.sm, maxWidth: 120 },
  divider: { height: 1, marginHorizontal: 4 },
  vilatechCard: { alignItems: 'center', paddingVertical: 24 },
  vilatechTitle: { ...TYPO.title2, letterSpacing: 4 },
  vilatechDesc: { fontSize: FONT.sm, textAlign: 'center', marginTop: 6 },
  vilatechLink: { fontSize: FONT.base, fontWeight: '600', marginTop: 8 },
  version: { fontSize: FONT.xs, textAlign: 'center', marginTop: 16 },
});
