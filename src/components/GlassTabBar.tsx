import React from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, RADIUS, FONT, BRAND } from '../constants/theme';
import { LAYOUT } from '../constants/layout';
import { GLASS } from '../constants/glass';
import { webOnlyStyle } from '../utils/webStyles';
import { getGlassVariant, getBlurIntensity } from '../utils/platform';

const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  Home: { icon: 'grid', label: 'Dashboard' },
  Contacts: { icon: 'people', label: 'Contacts' },
  // Route key stays 'Live'; the label and icon must not imply live transcription.
  Live: { icon: 'call', label: 'Calls' },
  Archive: { icon: 'document-text', label: 'Minutes' },
  Settings: { icon: 'settings', label: 'Settings' },
};

/** Primary liquid-glass chrome — floating nav over corporate content. */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const palette = COLORS[effectiveTheme];
  const variant = getGlassVariant();

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
            borderColor: GLASS.border.rim,
            maxWidth: LAYOUT.maxTabBarWidth,
          },
          webOnlyStyle({
            backdropFilter: `blur(${GLASS.blur.webPx.tabBar}px) saturate(${GLASS.saturate.web})`,
            WebkitBackdropFilter: `blur(${GLASS.blur.webPx.tabBar}px) saturate(${GLASS.saturate.web})`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 24px -8px rgba(0,0,0,0.55)',
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
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? palette.glassFill : palette.glassFill,
              opacity: Platform.OS === 'android' ? 0.92 : 1,
            },
          ]}
        />

        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const config = TAB_CONFIG[route.name] ?? TAB_CONFIG.Home;

            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={styles.tab}
              >
                <View
                  style={[
                    styles.iconWrap,
                    focused && {
                      backgroundColor: `${BRAND.accent}22`,
                    },
                  ]}
                >
                  <Ionicons
                    name={focused ? config.icon : (`${config.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                    size={22}
                    color={focused ? BRAND.accent : palette.textMuted}
                  />
                  {/* The red "live" dot was removed with the fake recorder —
                      nothing is ever live. */}
                </View>
                <Text
                  style={[
                    styles.label,
                    { color: focused ? BRAND.accent : palette.textMuted },
                  ]}
                >
                  {config.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
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
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  tabsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  label: {
    fontSize: FONT.xs,
    fontWeight: '600',
  },
});
