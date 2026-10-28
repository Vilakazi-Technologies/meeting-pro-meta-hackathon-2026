import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, FONT, CHART } from '../../constants/theme';

interface RingGaugeProps {
  /** 0–1 */
  value: number | null;
  label: string;
  sublabel?: string;
  size?: number;
  color?: string;
}

export function RingGauge({
  value,
  label,
  sublabel,
  size = 96,
  color = CHART.answered,
}: RingGaugeProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value != null ? Math.min(1, Math.max(0, value)) : 0;
  const dash = c * pct;

  return (
    <View style={[styles.wrap, { width: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={CHART.grid}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeDashoffset={c * 0.25}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: palette.text }]}>
          {value != null ? `${Math.round(pct * 100)}%` : '—'}
        </Text>
      </View>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: palette.textMuted }]}>{sublabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    top: -6,
  },
  value: { fontSize: FONT.lg, fontWeight: '800' },
  label: { fontSize: FONT.sm, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  sublabel: { fontSize: FONT.xs, marginTop: 2, textAlign: 'center' },
});
