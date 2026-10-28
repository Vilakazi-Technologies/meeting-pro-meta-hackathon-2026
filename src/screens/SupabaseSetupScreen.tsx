import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { Surface } from '../components/Surface';
import { TYPO } from '../constants/typography';
import { useTheme } from '../contexts/ThemeContext';
import { BRAND, COLORS } from '../constants/theme';
import { PRODUCT } from '../constants/brand';

/** Shown after sign-in when live Supabase env vars are missing. */
export function SupabaseSetupScreen() {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { signOut } = useAuth();

  return (
    <AuthScreenShell>
      <Surface style={styles.card}>
        <Text style={[TYPO.title3, { color: palette.text }]}>Supabase is not configured</Text>
        <Text style={[TYPO.body, styles.body, { color: palette.textSecondary }]}>
          {PRODUCT.name} needs your Supabase project URL and anon key in a local{' '}
          <Text style={{ fontFamily: 'monospace' }}>.env</Text> file.
        </Text>
        <Text style={[TYPO.callout, styles.mono, { color: palette.textSecondary }]}>
          EXPO_PUBLIC_SUPABASE_URL=…{'\n'}
          EXPO_PUBLIC_SUPABASE_ANON_KEY=…
        </Text>
        <Text style={[TYPO.footnote, { color: palette.textMuted }]}>
          Copy from Supabase → Project Settings → API. Restart with{' '}
          <Text style={{ fontFamily: 'monospace' }}>npx expo start --clear</Text>.
        </Text>
        <Text style={[TYPO.footnote, styles.demo, { color: palette.textMuted }]}>
          UI-only demo (no database): set{' '}
          <Text style={{ fontFamily: 'monospace' }}>EXPO_PUBLIC_DATA_SOURCE=mock</Text> in{' '}
          <Text style={{ fontFamily: 'monospace' }}>.env</Text>.
        </Text>
        <Pressable onPress={() => signOut()} style={styles.signOut}>
          <Text style={[TYPO.callout, { color: BRAND.accent }]}>Sign out</Text>
        </Pressable>
      </Surface>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  body: { marginTop: 4 },
  mono: { fontFamily: 'monospace', lineHeight: 22 },
  demo: { marginTop: 8 },
  signOut: { marginTop: 16, alignSelf: 'flex-start' },
});
