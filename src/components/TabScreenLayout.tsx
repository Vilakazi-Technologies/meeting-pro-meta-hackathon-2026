import React, { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
  type RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBackground } from './GlassBackground';
import { ContentColumn } from './ContentColumn';
import { LAYOUT } from '../constants/layout';
import { useTabScreenBottomInset } from '../hooks/useScrollInsets';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface TabScreenLayoutProps {
  children: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

/** Standard tab screen: black canvas, scroll, consistent padding, tab-bar clearance. */
export function TabScreenLayout({ children, refreshControl }: TabScreenLayoutProps) {
  const bottomInset = useTabScreenBottomInset();
  const { screenPaddingH, isDesktopWeb } = useResponsiveLayout();

  return (
    <GlassBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: bottomInset,
              paddingHorizontal: screenPaddingH,
              paddingTop: isDesktopWeb ? 4 : LAYOUT.screenPaddingTop,
            },
          ]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          refreshControl={refreshControl}
        >
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
  },
});
