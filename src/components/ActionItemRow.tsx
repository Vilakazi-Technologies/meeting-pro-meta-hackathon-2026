import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionItem } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, FONT } from '../constants/theme';

interface ActionItemRowProps {
  item: ActionItem;
  onToggle?: () => void;
}

export function ActionItemRow({ item, onToggle }: ActionItemRowProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];

  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <Ionicons
        name={item.completed ? 'checkbox' : 'square-outline'}
        size={22}
        color={item.completed ? palette.success : palette.textMuted}
      />
      <View style={styles.content}>
        <Text
          style={[
            styles.text,
            { color: palette.text },
            item.completed && styles.completed,
          ]}
        >
          {item.text}
        </Text>
        {item.assignee && (
          <Text style={[styles.assignee, { color: palette.textMuted }]}>
            → {item.assignee}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: FONT.base,
    lineHeight: 22,
  },
  completed: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  assignee: {
    fontSize: FONT.sm,
    marginTop: 2,
  },
});
