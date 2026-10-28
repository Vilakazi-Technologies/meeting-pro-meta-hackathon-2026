import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  Pressable,
  PressableProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, RADIUS } from '../constants/theme';
import { GLASS } from '../constants/glass';
import {
  getGlassVariant,
  getBlurIntensity,
  getGlassOpacity,
} from '../utils/platform';
import { webOnlyStyle } from '../utils/webStyles';
import { Surface } from './Surface';

export type CardMaterial = 'surface' | 'liquid';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  onPress?: PressableProps['onPress'];
  noPadding?: boolean;
  /** Default `surface` (corporate). Use `liquid` only for intentional chrome. */
  material?: CardMaterial;
  elevated?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity,
  onPress,
  noPadding = false,
  material = 'surface',
  elevated = false,
}: GlassCardProps) {
  if (material === 'surface') {
    return (
      <Surface style={style} onPress={onPress} noPadding={noPadding} elevated={elevated}>
        {children}
      </Surface>
    );
  }

  return (
    <LiquidGlassCard
      style={style}
      intensity={intensity}
      onPress={onPress}
      noPadding={noPadding}
    >
      {children}
    </LiquidGlassCard>
  );
}

/** iOS 26–style liquid glass — navigation / focal chrome only. */
function LiquidGlassCard({
  children,
  style,
  intensity,
  onPress,
  noPadding,
}: Omit<GlassCardProps, 'material'>) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const palette = COLORS[effectiveTheme];
  const variant = getGlassVariant();
  const blur = intensity ?? getBlurIntensity(variant, isDark);
  const fillOpacity = getGlassOpacity(variant, isDark);

  const content = (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: GLASS.border.rim,
          borderRadius: RADIUS.lg,
        },
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={blur}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette.glassFill, opacity: fillOpacity },
            webOnlyStyle({
              backdropFilter: `blur(${GLASS.blur.webPx.card}px) saturate(${GLASS.saturate.web})`,
              WebkitBackdropFilter: `blur(${GLASS.blur.webPx.card}px) saturate(${GLASS.saturate.web})`,
              backgroundColor: GLASS.fill.bodyDark,
              boxShadow: GLASS.shadow.card.web,
            }),
          ]}
        />
      )}

      <LinearGradient
        colors={[...GLASS.sheen.top]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.liquidSheen]}
      />

      <View style={[styles.content, !noPadding && styles.padding]}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  liquidSheen: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  padding: {
    padding: 16,
  },
});
