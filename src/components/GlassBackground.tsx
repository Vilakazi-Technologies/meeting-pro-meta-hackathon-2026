import React, { ReactNode, useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, BRAND } from '../constants/theme';
import { VILATECH_STORY } from '../constants/glass';
import { webOnlyStyle } from '../utils/webStyles';

interface GlassBackgroundProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * VILATECH story canvas — same language as VILATECH site (soft elliptical gradients + grain),
 * no hard circular blobs. Liquid glass stays on nav only.
 */
export function GlassBackground({ children, style }: GlassBackgroundProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const isDark = effectiveTheme === 'dark';
  const story = isDark ? VILATECH_STORY.dark : VILATECH_STORY.light;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'meeting-pro-story-keyframes';
    if (document.getElementById(id)) return;
    const styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.textContent = `
      @keyframes meeting-pro-story-ambient {
        0% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(3%, 2.5%, 0) scale(1.05); }
        100% { transform: translate3d(-2.5%, 4%, 0) scale(1.02); }
      }
    `;
    document.head.appendChild(styleEl);
  }, []);

  const baseGradient = isDark
    ? (['#000000', '#030303', '#070707', '#020202', '#000000'] as const)
    : palette.backgroundGradient;

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[...baseGradient]}
        locations={isDark ? [0, 0.25, 0.55, 0.8, 1] : undefined}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {Platform.OS === 'web' ? (
        <View
          pointerEvents="none"
          style={[
            styles.storyWeb,
            webOnlyStyle({
              background: story.css,
              animation: 'meeting-pro-story-ambient 36s ease-in-out infinite alternate',
              willChange: 'transform',
            }),
          ]}
        />
      ) : (
        story.nativeWashes.map((wash, i) => (
          <LinearGradient
            key={i}
            colors={[...wash.colors]}
            start={wash.start}
            end={wash.end}
            style={[StyleSheet.absoluteFill, { opacity: wash.opacity }]}
            pointerEvents="none"
          />
        ))
      )}

      <View
        pointerEvents="none"
        style={[
          styles.grain,
          webOnlyStyle({
            opacity: isDark ? VILATECH_STORY.grainOpacity.dark : VILATECH_STORY.grainOpacity.light,
            backgroundImage: GRAIN_SVG,
          }),
        ]}
      />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.black,
    overflow: 'hidden',
  },
  storyWeb: {
    position: 'absolute',
    top: '-12%',
    left: '-12%',
    right: '-12%',
    bottom: '-12%',
  },
  grain: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    minHeight: 0,
    zIndex: 1,
  },
});
