import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, FONT, CHART, SPACING } from '../../constants/theme';
import type { DayVolume } from '../../data/callAnalytics';

interface StackedBarChartProps {
  data: DayVolume[];
  height?: number;
}

const PAD_LEFT = 28;
const PAD_BOTTOM = 22;
const PAD_TOP = 8;

/** Seven-day answered (green) vs missed (gray) with grid and Y axis. */
export function StackedBarChart({ data, height = 168 }: StackedBarChartProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { width: screenW } = useWindowDimensions();
  const chartWidth = Math.min(screenW - 80, 360);

  const max = Math.max(1, ...data.map((d) => d.answered + d.missed));
  const yTicks = useMemo(() => {
    if (max <= 2) return [0, 1, 2];
    const step = max <= 5 ? 1 : Math.ceil(max / 4);
    const ticks: number[] = [];
    for (let v = 0; v <= max; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] !== max) ticks.push(max);
    return ticks;
  }, [max]);

  const plotH = height - PAD_BOTTOM - PAD_TOP;
  const barSlot = (chartWidth - PAD_LEFT - 8) / data.length;
  const barW = Math.min(32, barSlot * 0.55);

  return (
    <View style={styles.wrap}>
      <Svg width={chartWidth} height={height}>
        {yTicks.map((tick) => {
          const y = PAD_TOP + plotH - (tick / max) * plotH;
          return (
            <React.Fragment key={`grid-${tick}`}>
              <Line
                x1={PAD_LEFT}
                y1={y}
                x2={chartWidth - 4}
                y2={y}
                stroke={CHART.grid}
                strokeWidth={1}
              />
              <SvgText
                x={PAD_LEFT - 6}
                y={y + 4}
                fill={CHART.axis}
                fontSize={10}
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </React.Fragment>
          );
        })}

        {data.map((d, i) => {
          const total = d.answered + d.missed;
          const cx = PAD_LEFT + i * barSlot + barSlot / 2;
          const x = cx - barW / 2;
          const answeredH = (d.answered / max) * plotH;
          const missedH = (d.missed / max) * plotH;
          const baseY = PAD_TOP + plotH;
          return (
            <React.Fragment key={d.label}>
              {d.missed > 0 ? (
                <Rect
                  x={x}
                  y={baseY - missedH - answeredH}
                  width={barW}
                  height={missedH}
                  rx={6}
                  fill={CHART.missed}
                />
              ) : null}
              {d.answered > 0 ? (
                <Rect
                  x={x}
                  y={baseY - answeredH}
                  width={barW}
                  height={answeredH}
                  rx={6}
                  fill={CHART.answered}
                />
              ) : null}
              {total === 0 ? (
                <Rect
                  x={x}
                  y={baseY - 3}
                  width={barW}
                  height={3}
                  rx={2}
                  fill="rgba(255,255,255,0.06)"
                />
              ) : null}
              <SvgText
                x={cx}
                y={height - 4}
                fill={CHART.axis}
                fontSize={10}
                fontWeight="600"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legend}>
        <LegendDot color={CHART.answered} label="Answered" muted={palette.textMuted} />
        <LegendDot color={CHART.missed} label="Missed / busy" muted={palette.textMuted} />
      </View>
    </View>
  );
}

function LegendDot({ color, label, muted }: { color: string; label: string; muted: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: SPACING.sm },
  legend: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FONT.xs, fontWeight: '600' },
});
