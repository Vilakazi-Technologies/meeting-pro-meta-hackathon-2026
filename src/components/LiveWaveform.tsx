import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BRAND } from '../constants/theme';

const BAR_COUNT = 24;

export function LiveWaveform({ active = true }: { active?: boolean }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveBar key={i} index={i} active={active} />
      ))}
    </View>
  );
}

function WaveBar({ index, active }: { index: number; active: boolean }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (!active) {
      height.value = withTiming(8, { duration: 300 });
      return;
    }
    height.value = withDelay(
      index * 40,
      withRepeat(
        withTiming(12 + Math.random() * 36, {
          duration: 400 + (index % 5) * 80,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, [active, index, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        { backgroundColor: index % 3 === 0 ? BRAND.whatsapp : BRAND.accent },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 56,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    opacity: 0.85,
  },
});
