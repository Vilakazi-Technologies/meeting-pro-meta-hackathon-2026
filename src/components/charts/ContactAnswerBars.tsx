import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, FONT, CHART, SPACING } from '../../constants/theme';
import type { ContactCallStats } from '../../data/callAnalytics';

interface ContactAnswerBarsProps {
  contacts: ContactCallStats[];
}

const BAR_W = 100;
const BAR_H = 10;

export function ContactAnswerBars({ contacts }: ContactAnswerBarsProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];

  if (contacts.length === 0) {
    return (
      <Text style={[styles.empty, { color: palette.textMuted }]}>
        Add contacts and place calls to see answer rates here.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {contacts.map((c) => {
        const rate = c.answerRate ?? 0;
        const pct = Math.round(rate * 100);
        const fillW = Math.max((pct / 100) * BAR_W, 4);
        const fillColor =
          pct >= 70 ? CHART.answered : pct >= 40 ? CHART.accent : CHART.missed;
        return (
          <View key={c.key} style={styles.row}>
            <View style={styles.labelCol}>
              <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
                {c.label}
              </Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>
                {c.answered}/{c.total} answered · avg{' '}
                {c.avgDurationSeconds != null
                  ? `${Math.round(c.avgDurationSeconds / 60)} min`
                  : '—'}
              </Text>
            </View>
            <View style={styles.barCol}>
              <Svg width={BAR_W} height={BAR_H}>
                <Rect
                  x={0}
                  y={0}
                  width={BAR_W}
                  height={BAR_H}
                  rx={5}
                  fill={CHART.grid}
                />
                <Rect x={0} y={0} width={fillW} height={BAR_H} rx={5} fill={fillColor} />
              </Svg>
              <Text style={[styles.pct, { color: palette.textSecondary }]}>{pct}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.md, width: '100%' },
  empty: { fontSize: FONT.sm, lineHeight: 20 },
  row: { gap: SPACING.sm },
  labelCol: { minWidth: 0 },
  name: { fontSize: FONT.sm, fontWeight: '700' },
  meta: { fontSize: FONT.xs, marginTop: 2 },
  barCol: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pct: { width: 36, fontSize: FONT.xs, fontWeight: '700', textAlign: 'right' },
});
