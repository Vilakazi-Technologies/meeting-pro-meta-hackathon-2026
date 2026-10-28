import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT, RADIUS } from '../constants/theme';
import { Speaker } from '../types';

interface SpeakerChipProps {
  speaker: Speaker;
  compact?: boolean;
}

export function SpeakerChip({ speaker, compact }: SpeakerChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor: `${speaker.color}22`, borderColor: `${speaker.color}44` }]}>
      <View style={[styles.dot, { backgroundColor: speaker.color }]} />
      <Text style={[styles.name, { color: speaker.color }, compact && styles.compact]}>
        {speaker.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  compact: {
    fontSize: FONT.xs,
  },
});
