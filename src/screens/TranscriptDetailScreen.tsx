import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBackground } from '../components/GlassBackground';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassCard } from '../components/GlassCard';
import { StackScreenLayout } from '../components/StackScreenLayout';
import { SpeakerChip } from '../components/SpeakerChip';
import { ActionItemRow } from '../components/ActionItemRow';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND } from '../constants/theme';
import { useTranscript, retryTranscript, setActionItemDone } from '../data/transcriptSource';
import { RootStackParamList, ActionItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TranscriptDetail'>;

export function TranscriptDetailScreen({ route, navigation }: Props) {
  const { transcriptId } = route.params;
  const { transcript, loading, error, getSpeakerById, reload } = useTranscript(transcriptId);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    transcript?.actionItems ?? []
  );

  // The transcript now arrives asynchronously, after the first render has already
  // run the useState initialiser above with nothing. Sync once it lands.
  useEffect(() => {
    setActionItems(transcript?.actionItems ?? []);
  }, [transcript]);

  if (!transcript) {
    return (
      <GlassBackground>
        <SafeAreaView style={styles.safe}>
          <Text style={{ color: palette.text, padding: 20 }}>
            {loading
              ? 'Loading transcript…'
              : error
                ? `Could not load transcript: ${error}`
                : 'Transcript not found.'}
          </Text>
        </SafeAreaView>
      </GlassBackground>
    );
  }

  const handleRetry = async () => {
    setRetrying(true);
    setRetryMessage(null);
    const result = await retryTranscript(transcript.id);
    setRetrying(false);
    if (result.outcome === 'ready' || result.outcome === 'already_ready') {
      reload();
    } else {
      setRetryMessage(result.message);
    }
  };

  // Tick the box straight away so it feels immediate, then save. If the save
  // fails, put it back — better than showing a tick that was never stored.
  const toggleAction = async (id: string) => {
    const current = actionItems.find((item) => item.id === id);
    if (!current) return;
    const next = !current.completed;
    setActionItems((items) =>
      items.map((item) => (item.id === id ? { ...item, completed: next } : item))
    );
    const { error: saveError } = await setActionItemDone(id, next);
    if (saveError) {
      setActionItems((items) =>
        items.map((item) => (item.id === id ? { ...item, completed: !next } : item))
      );
    }
  };

  const date = new Date(transcript.date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <StackScreenLayout
      fullBleedHeader={
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </Pressable>
          <View style={styles.topActions}>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="share-outline" size={22} color={palette.text} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={BRAND.accent} />
            </Pressable>
          </View>
        </View>
      }
      contentStyle={styles.scrollBody}
    >
          <Text style={[styles.title, { color: palette.text }]}>{transcript.title}</Text>
          <Text style={[styles.meta, { color: palette.textMuted }]}>
            {date} · {transcript.duration}
          </Text>

          <View style={styles.tags}>
            {transcript.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: `${BRAND.accent}18` }]}>
                <Text style={[styles.tagText, { color: BRAND.accent }]}>#{tag}</Text>
              </View>
            ))}
          </View>

          {transcript.status === 'failed' && (
            <GlassCard style={[styles.block, styles.failedCard]}>
              <View style={styles.aiHeader}>
                <Ionicons name="alert-circle" size={18} color={palette.error} />
                <Text style={[styles.aiLabel, { color: palette.error }]}>
                  Transcript unavailable
                </Text>
              </View>
              <Text style={[styles.failedBody, { color: palette.textSecondary }]}>
                This call was transcribed by WhatsApp, but the transcript could not be
                downloaded or verified. WhatsApp keeps transcripts for 7 days after the call.
              </Text>
              <Pressable
                testID="transcript-retry"
                style={[styles.retryButton, { backgroundColor: BRAND.accent, opacity: retrying ? 0.6 : 1 }]}
                onPress={handleRetry}
                disabled={retrying}
              >
                {retrying ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#FFF" />
                    <Text style={styles.retryText}>Retry download</Text>
                  </>
                )}
              </Pressable>
              {retryMessage && (
                <Text testID="transcript-retry-message" style={[styles.failedBody, { color: palette.textMuted }]}>
                  {retryMessage}
                </Text>
              )}
            </GlassCard>
          )}

          {/* The section is always shown, and says where things stand. Hiding it
              left the reader unsure whether a summary was missing, pending or
              broken; an empty card would have implied failure. */}
          {transcript.status !== 'failed' && (
            <>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                AI Summary
              </Text>
              <GlassCard style={styles.block}>
                <View style={styles.aiHeader}>
                  <Ionicons
                    name={transcript.summary ? 'bulb' : 'bulb-outline'}
                    size={18}
                    color={transcript.summary ? BRAND.gold : palette.textMuted}
                  />
                  <Text
                    style={[
                      styles.aiLabel,
                      { color: transcript.summary ? BRAND.gold : palette.textMuted },
                    ]}
                  >
                    {transcript.summary ? 'Meeting Pro AI' : 'Not available yet'}
                  </Text>
                </View>
                <Text style={[styles.summaryText, { color: palette.textSecondary }]}>
                  {transcript.summary
                    ? transcript.summary
                    : transcript.summaryStatus === 'failed'
                      ? 'A summary could not be generated for this call. The transcript below is complete and unaffected.'
                      : 'Automatic summaries are not switched on for this account yet. The full transcript below is complete.'}
                </Text>
              </GlassCard>
            </>
          )}

          {actionItems.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Action Items
              </Text>
              <GlassCard style={styles.block}>
                {actionItems.map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleAction(item.id)}
                  />
                ))}
              </GlassCard>
            </>
          )}

          {transcript.segments && transcript.segments.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Full Transcript · Speaker ID
              </Text>
              {transcript.segments.map((seg) => {
                const speaker = getSpeakerById(seg.speakerId);
                return (
                  <GlassCard key={seg.id} style={styles.segmentCard}>
                    <View style={styles.segmentHeader}>
                      {speaker && <SpeakerChip speaker={speaker} compact />}
                      <Text style={[styles.timestamp, { color: palette.textMuted }]}>
                        {seg.timestamp}
                      </Text>
                    </View>
                    <Text style={[styles.segmentText, { color: palette.text }]}>
                      {seg.text}
                    </Text>
                  </GlassCard>
                );
              })}
            </>
          )}

          {/* An "Export to CRM" card sat here — a chevron, three named
              integrations, and no handler behind any of them. Nothing exports
              anywhere yet. */}

    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  scrollBody: { paddingTop: 0 },
  title: { fontSize: FONT.xxl, fontWeight: '700', lineHeight: 32 },
  meta: { fontSize: FONT.sm, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  tagText: { fontSize: FONT.sm, fontWeight: '600' },
  sectionTitle: { fontSize: FONT.lg, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  block: { marginBottom: 4 },
  failedCard: { gap: 10 },
  failedBody: { fontSize: FONT.sm, lineHeight: 20 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  retryText: { color: '#FFF', fontSize: FONT.base, fontWeight: '700' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  aiLabel: { fontSize: FONT.sm, fontWeight: '700' },
  summaryText: { fontSize: FONT.base, lineHeight: 24 },
  segmentCard: { marginBottom: 8 },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: { fontSize: FONT.xs, fontVariant: ['tabular-nums'] },
  segmentText: { fontSize: FONT.base, lineHeight: 22 },
});
