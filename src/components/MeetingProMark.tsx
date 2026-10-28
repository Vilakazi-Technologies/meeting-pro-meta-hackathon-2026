import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

const iconSource = require('../../assets/icon.png');

interface MeetingProMarkProps {
  size?: number;
  style?: ViewStyle;
  /** Subtle ring for hero / auth headers */
  framed?: boolean;
}

/** Meeting Pro app icon — use instead of third-party messenger logos in UI. */
export function MeetingProMark({ size = 48, style, framed = false }: MeetingProMarkProps) {
  const radius = Math.round(size * 0.22);

  return (
    <View
      style={[
        styles.wrap,
        framed && styles.framed,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Meeting Pro"
    >
      <Image
        source={iconSource}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  framed: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
