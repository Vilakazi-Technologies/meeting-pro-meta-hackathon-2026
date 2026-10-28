import React from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabScreenLayout } from '../components/TabScreenLayout';
import { GlassCard } from '../components/GlassCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND, ThemePalette } from '../constants/theme';
import { LAYOUT } from '../constants/layout';
import { useCallHistory, formatCallDuration, CallRecord } from '../data/callHistory';
import { MainTabParamList, RootStackParamList } from '../types';

// Call history: one row per call on the business's WhatsApp number, newest
// first, with what happened to its transcript.
//
// This is NOT a live view and cannot be. Meta transcribes on its own servers
// and sends the result only after a call ends, so nothing here updates during a
// call. The list refreshes when calls/transcripts change in Supabase; only the
// transcript text arrives after the call ends (Meta server-side transcription).

type CallsNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Live'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: CallsNav };

const STATE_META: Record<
  CallRecord['transcriptState'],
  { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'good' | 'bad' | 'muted' }
> = {
  ready: { label: 'Transcribed', icon: 'document-text', tone: 'good' },
  failed: { label: 'Transcript failed', icon: 'alert-circle', tone: 'bad' },
  waiting: { label: 'Waiting for transcript', icon: 'hourglass-outline', tone: 'muted' },
};

function formatWhen(iso: string | null): string {
  if (!iso) return 'Time unknown';
  return new Date(iso).toLocaleString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LiveScreen({ navigation }: Props) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { calls, loading, error, reload } = useCallHistory();

  return (
    <TabScreenLayout
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={reload} tintColor={palette.textMuted} />
      }
    >
          <ScreenHeader
            title="Call log"
            subtitle="Answered, missed, and transcript status — newest first"
          />

          {calls.map((call) => {
            const meta = STATE_META[call.transcriptState];
            const tone =
              meta.tone === 'good'
                ? palette.success
                : meta.tone === 'bad'
                  ? palette.error
                  : palette.textMuted;
            const openable = call.transcriptId !== null;
            return (
              <Pressable
                key={call.id}
                disabled={!openable}
                onPress={() =>
                  call.transcriptId &&
                  navigation.navigate('TranscriptDetail', { transcriptId: call.transcriptId })
                }
              >
                <GlassCard style={styles.card}>
                  <View style={styles.row}>
                    <View style={[styles.iconWrap, { backgroundColor: `${BRAND.whatsapp}1A` }]}>
                      <Ionicons
                        name={call.direction === 'business_initiated' ? 'call-outline' : 'call'}
                        size={18}
                        color={BRAND.whatsapp}
                      />
                    </View>
                    <View style={styles.textBlock}>
                      <Text style={[styles.number, { color: palette.text }]} numberOfLines={1}>
                        {call.counterparty ?? 'Unknown number'}
                      </Text>
                      <Text style={[styles.when, { color: palette.textMuted }]} numberOfLines={1}>
                        {formatWhen(call.startedAt)} · {formatCallDuration(call.durationSeconds)}
                      </Text>
                    </View>
                    {openable && (
                      <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
                    )}
                  </View>

                  <View style={styles.stateRow}>
                    <Ionicons name={meta.icon} size={14} color={tone} />
                    <Text style={[styles.stateText, { color: tone }]} numberOfLines={1}>
                      {call.transcriptTitle ?? meta.label}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}

          {calls.length === 0 && (
            <GlassCard style={styles.emptyCard}>
              <Ionicons
                name={loading ? 'time-outline' : 'call-outline'}
                size={24}
                color={palette.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                {loading ? 'Loading…' : error ? 'Could not load calls' : 'No calls yet'}
              </Text>
              <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
                {error
                  ? error
                  : loading
                    ? ''
                    : 'Calls on your WhatsApp Business number appear here once they end. Nothing is recorded on this device.'}
              </Text>
            </GlassCard>
          )}

    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, marginBottom: LAYOUT.itemGap },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  number: { fontSize: FONT.base, fontWeight: '600' },
  when: { fontSize: FONT.xs, marginTop: 2 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stateText: { flex: 1, fontSize: FONT.sm, fontWeight: '500' },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyTitle: { fontSize: FONT.base, fontWeight: '700' },
  emptyBody: { fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },
});
