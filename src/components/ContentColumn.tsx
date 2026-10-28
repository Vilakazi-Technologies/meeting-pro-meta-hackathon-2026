import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { LAYOUT } from '../constants/layout';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface ContentColumnProps {
  children: ReactNode;
  /** Narrower column for auth and settings-style forms */
  variant?: 'page' | 'form';
  style?: StyleProp<ViewStyle>;
}

/** Centers content and caps width on web / large phones — VILATECH convention. */
export function ContentColumn({ children, variant = 'page', style }: ContentColumnProps) {
  const { contentMaxWidth, isDesktopWeb } = useResponsiveLayout();
  const maxWidth =
    variant === 'form'
      ? Math.min(LAYOUT.maxFormWidth, contentMaxWidth)
      : contentMaxWidth;

  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth,
          alignSelf: 'center',
          gap: isDesktopWeb ? 12 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
