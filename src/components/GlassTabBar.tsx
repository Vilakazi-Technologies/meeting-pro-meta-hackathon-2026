import React from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, RADIUS, FONT, BRAND } from '../constants/theme';
import { LAYOUT } from '../constants/layout';
import { GLASS } from '../constants/glass';
import { springs, motionTokens } from '../constants/motionTokens';
import { webOnlyStyle } from '../utils/webStyles';
import { getGlassVariant, getBlurIntensity } from '../utils/platform';
import { useReducedMotion } from '../hooks/useReducedMotion';

const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  Home: { icon: 'grid', label: 'Dashboard' },
  Contacts: { icon: 'people', label: 'Contacts' },
  Live: { icon: 'call', label: 'Calls' },
  Archive: { icon: 'document-text', label: 'Minutes' },
  Settings: { icon: 'settings', label: 'Settings' },
};

function TabItem({
  focused,
  label,
  icon,
  onPress,
  reduceMotion,
  muted,
}: {
  focused: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  reduceMotion: boolean;
  muted: string;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          void Haptics.selectionAsync();
        }
        onPress();
      }}
      onPressIn={() => {
        if (!reduceMotion) {
          scale.value = withSpring(motionTokens.scale.press, springs.snappy);
        }
      }}
      onPressOut={() => {
        if (!reduceMotion) {
          scale.value = withSpring(motionTokens.scale.settle, springs.snappy);
        }
      }}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Animated.View style={[styles.iconWrap, animStyle]}>
        {focused ? (
          <View
            style={[
              styles.selectedPill,
              webOnlyStyle({
                backdropFilter: `blur(${GLASS.blur.webPx.standard}px) saturate(${GLASS.saturate.web})`,
                WebkitBackdropFilter: `blur(${GLASS.blur.webPx.standard}px) saturate(${GLASS.saturate.web})`,
              }),
            ]}
          />
        ) : null}
        <Ionicons
          name={focused ? icon : (`${icon}-outline` as keyof typeof Ionicons.glyphMap)}
          size={22}
          color={focused ? BRAND.qualityBlue : muted}
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: focused ? BRAND.qualityBlue : muted },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Functional-layer liquid glass only (Apple HIG materials).
 * Content stays opaque; accent colors the selected control, not every label.
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const palette = COLORS[effectiveTheme];
  const variant = getGlassVariant();
  const reduceMotion = useReducedMotion();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.barOuter,
          {
            borderRadius: variant === 'liquid' ? RADIUS.xl : RADIUS.lg,
            borderColor: isDark ? GLASS.border.rim : GLASS.border.light,
            maxWidth: LAYOUT.maxTabBarWidth,
            backgroundColor: isDark ? 'rgba(12,12,14,0.55)' : 'rgba(255,255,255,0.72)',
          },
          webOnlyStyle({
            backdropFilter: `blur(${GLASS.blur.webPx.tabBar}px) saturate(${GLASS.saturate.web})`,
            WebkitBackdropFilter: `blur(${GLASS.blur.webPx.tabBar}px) saturate(${GLASS.saturate.web})`,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.25), 0 12px 40px -12px rgba(0,0,0,0.55)',
          }),
        ]}
      >
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={getBlurIntensity(variant, isDark)}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        {Platform.OS === 'android' && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? palette.glassFill : palette.glassFill,
                opacity: 0.94,
              },
            ]}
          />
        )}

        <LinearSheen isDark={isDark} />

        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const config = TAB_CONFIG[route.name] ?? TAB_CONFIG.Home;

            return (
              <TabItem
                key={route.key}
                focused={focused}
                label={config.label}
                icon={config.icon}
                reduceMotion={reduceMotion}
                muted={palette.textMuted}
                onPress={() => navigation.navigate(route.name)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function LinearSheen({ isDark }: { isDark: boolean }) {
  if (!isDark) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.sheen,
        webOnlyStyle({
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 42%, transparent 70%)',
        }),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  barOuter: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 14 },
    }),
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    height: '55%',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 48,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectedPill: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS.full,
    backgroundColor: `${BRAND.qualityBlue}28`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${BRAND.qualityBlue}44`,
  },
  label: {
    fontSize: FONT.xs,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
