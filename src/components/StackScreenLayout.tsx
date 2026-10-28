import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, Platform, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBackground } from './GlassBackground';
import { ContentColumn } from './ContentColumn';
import { LAYOUT } from '../constants/layout';
import { useStackScreenBottomInset } from '../hooks/useScrollInsets';

interface StackScreenLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  /** Full-width header (back button row) outside ContentColumn */
  fullBleedHeader?: ReactNode;
  contentStyle?: ViewStyle;
}

/** Stack/modal screens — scrollable body with safe bottom inset (no tab bar). */
export function StackScreenLayout({
  children,
  header,
  fullBleedHeader,
  contentStyle,
}: StackScreenLayoutProps) {
  const bottomInset = useStackScreenBottomInset();

  return (
    <GlassBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {fullBleedHeader}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomInset },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
        >
          {header}
          <ContentColumn>{children}</ContentColumn>
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPaddingH,
    paddingTop: LAYOUT.screenPaddingTop,
  },
});
