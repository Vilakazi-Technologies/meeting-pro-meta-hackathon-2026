import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassBackground } from '../GlassBackground';
import { ContentColumn } from '../ContentColumn';
import { MeetingProMark } from '../MeetingProMark';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING } from '../../constants/theme';
import { TYPO } from '../../constants/typography';
import { COMPANY, PRODUCT } from '../../constants/brand';
import { LAYOUT } from '../../constants/layout';
import { useStackScreenBottomInset } from '../../hooks/useScrollInsets';

interface AuthScreenShellProps {
  children: ReactNode;
  footer?: string;
}

export function AuthScreenShell({
  children,
  footer = `${PRODUCT.fullLockup} · ${PRODUCT.tagline}`,
}: AuthScreenShellProps) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const bottomInset = useStackScreenBottomInset();
  const insets = useSafeAreaInsets();

  return (
    <GlassBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, SPACING.md) + SPACING.sm,
                paddingBottom: bottomInset,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <ContentColumn variant="form" style={styles.column}>
              <View style={styles.hero}>
                <MeetingProMark size={76} framed />
                <Text style={[styles.brand, { color: palette.textMuted }]}>{COMPANY.name}</Text>
                <Text style={[styles.headline, { color: palette.text }]}>{PRODUCT.name}</Text>
                <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                  Sign in to your VILATECH workspace — Business call minutes and transcripts
                </Text>
              </View>

              <View style={styles.authPanel}>{children}</View>

              <Text style={[styles.footer, { color: palette.textMuted }]}>{footer}</Text>
            </ContentColumn>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, minHeight: 0 },
  flex: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPaddingH,
    flexGrow: 1,
  },
  column: { gap: SPACING.lg },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    zIndex: 2,
  },
  brand: {
    ...TYPO.eyebrow,
    marginTop: SPACING.md,
  },
  headline: {
    ...TYPO.title2,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPO.callout,
    marginTop: SPACING.sm,
    textAlign: 'center',
    maxWidth: 340,
  },
  authPanel: {
    width: '100%',
    zIndex: 1,
  },
  footer: {
    ...TYPO.footnote,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
});
