import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabScreenLayout } from '../components/TabScreenLayout';
import { SearchBar } from '../components/SearchBar';
import { TranscriptCard } from '../components/TranscriptCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT, RADIUS, BRAND } from '../constants/theme';
import { LAYOUT } from '../constants/layout';
import { useTranscripts, useTranscriptSearch } from '../data/transcriptSource';
import { MainTabParamList, RootStackParamList } from '../types';

type ArchiveNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Archive'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: ArchiveNav };

// Each filter must be able to change what you see. 'WhatsApp' went the same
// way as 'Meetings' and 'Live': every transcript comes from a WhatsApp call, so
// it selected everything and told you nothing. 'Needs attention' replaces it —
// transcripts whose download failed and can be retried.
const FILTERS = ['All', 'Tagged', 'Needs attention'] as const;

export function ArchiveScreen({ navigation }: Props) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const { transcripts, loading, error } = useTranscripts();
  // The search runs in the database; this is the set of ids it matched.
  const { matchIds, searching, error: searchError } = useTranscriptSearch(query);

  const filtered = useMemo(() => {
    let list = [...transcripts];
    if (filter === 'Tagged') {
      list = list.filter((t) => t.tags.length > 0);
    } else if (filter === 'Needs attention') {
      list = list.filter((t) => t.status === 'failed');
    }
    if (matchIds !== null) {
      // Tags live in another table and are not part of the database search, so
      // a tag match is added here rather than being lost.
      const q = query.trim().toLowerCase();
      list = list.filter(
        (t) => matchIds.has(t.id) || t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [transcripts, matchIds, query, filter]);

  return (
    <TabScreenLayout>
          <ScreenHeader
            title="Meeting minutes"
            subtitle="Searchable transcripts and AI summaries to share"
          />

          <SearchBar value={query} onChangeText={setQuery} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? BRAND.accent : `${palette.textMuted}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: active ? '#FFF' : palette.textSecondary },
                    ]}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.resultCount, { color: palette.textMuted }]}>
            {filtered.length} session{filtered.length !== 1 ? 's' : ''}
            {query ? ` matching "${query}"` : ''}
          </Text>

          {filtered.map((t) => (
            <TranscriptCard
              key={t.id}
              transcript={t}
              onPress={() =>
                navigation.navigate('TranscriptDetail', { transcriptId: t.id })
              }
            />
          ))}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                {loading
                  ? 'Loading transcripts…'
                  : error
                    ? `Could not load transcripts: ${error}`
                    : searching
                      ? 'Searching…'
                      : searchError
                        ? `Search failed: ${searchError}`
                        : transcripts.length === 0
                          ? 'No transcripts yet. They appear here after a call on your WhatsApp Business number.'
                          : 'No transcripts match your search.'}
              </Text>
            </View>
          )}

    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingVertical: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  filterText: { fontSize: FONT.sm, fontWeight: '600' },
  resultCount: { fontSize: FONT.sm, marginBottom: 12 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: FONT.base },
});
