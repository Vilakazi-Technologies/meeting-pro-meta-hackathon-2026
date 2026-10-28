import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Pressable,
  PressableProps,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, RADIUS } from '../constants/theme';

interface SurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: PressableProps['onPress'];
  noPadding?: boolean;
  elevated?: boolean;
}

/**
 * Content panel — calm, bordered, no blur. Primary surface for data and lists.
 */
export function Surface({
  children,
  style,
  onPress,
  noPadding = false,
  elevated = false,
}: SurfaceProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const palette = COLORS[effectiveTheme];

  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: isDark
            ? elevated
              ? 'rgba(20, 20, 22, 0.92)'
              : 'rgba(12, 12, 14, 0.88)'
            : elevated
              ? '#FFFFFF'
              : palette.background,
          borderColor: isDark ? palette.glassBorder : palette.separator,
        },
        Platform.OS === 'web' && isDark
          ? ({
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 32px -20px rgba(0,0,0,0.65)',
            } as ViewStyle)
          : null,
        style,
      ]}
    >
      <View style={[!noPadding && styles.padding]}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  padding: {
    padding: 18,
  },
});
