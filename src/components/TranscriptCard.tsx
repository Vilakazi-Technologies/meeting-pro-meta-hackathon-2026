import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transcript } from '../types';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND } from '../constants/theme';

const SOURCE_ICONS: Record<Transcript['source'], keyof typeof Ionicons.glyphMap> = {
  whatsapp_voice: 'mic',
  whatsapp_call: 'call',
  meeting: 'people',
  upload: 'cloud-upload',
};

const STATUS_CONFIG: Record<
  Transcript['status'],
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  completed: { label: 'Done', color: '#10B981', icon: 'checkmark-circle' },
  processing: { label: 'Processing', color: '#F59E0B', icon: 'hourglass' },
  live: { label: 'Live', color: '#EF4444', icon: 'radio-button-on' },
  failed: { label: 'Failed', color: '#EF4444', icon: 'alert-circle' },
};

interface TranscriptCardProps {
  transcript: Transcript;
  onPress: () => void;
}

export function TranscriptCard({ transcript, onPress }: TranscriptCardProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const status = STATUS_CONFIG[transcript.status];
  const date = new Date(transcript.date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.sourceIcon, { backgroundColor: `${BRAND.whatsapp}22` }]}>
          <Ionicons name={SOURCE_ICONS[transcript.source]} size={18} color={BRAND.whatsapp} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
            {transcript.title}
          </Text>
          <Text style={[styles.meta, { color: palette.textMuted }]}>
            {date} · {transcript.duration}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}22` }]}>
          {transcript.status === 'live' && <View style={[styles.liveDot, { backgroundColor: status.color }]} />}
          <Ionicons name={status.icon} size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {transcript.summary && (
        <Text style={[styles.summary, { color: palette.textSecondary }]} numberOfLines={2}>
          {transcript.summary}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.tags}>
          {transcript.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: `${palette.textMuted}18` }]}>
              <Text style={[styles.tagText, { color: palette.textSecondary }]}>#{tag}</Text>
            </View>
          ))}
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FONT.lg,
    fontWeight: '600',
  },
  meta: {
    fontSize: FONT.sm,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FONT.xs,
    fontWeight: '600',
  },
  summary: {
    fontSize: FONT.sm,
    lineHeight: 20,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: FONT.xs,
    fontWeight: '500',
  },
});
