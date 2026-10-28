import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSSO } from '@clerk/expo';
import { useTheme } from '../../contexts/ThemeContext';
import { BRAND, COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { TYPO } from '../../constants/typography';
import { clerkOAuthRedirectUrl } from '../../lib/clerkOAuthRedirect';

function clerkErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'errors' in e) {
    const errs = (e as { errors: { message?: string; longMessage?: string }[] }).errors;
    if (errs?.[0]?.longMessage) return errs[0].longMessage;
    if (errs?.[0]?.message) return errs[0].message;
  }
  if (e instanceof Error) return e.message;
  return 'Google sign-in failed. Try again.';
}

type Props = {
  disabled?: boolean;
  onError?: (message: string) => void;
};

/** Native / Expo Go — Google OAuth inside VILATECH shell (not hosted Clerk UI). */
export function ClerkGoogleSignInButton({ disabled, onError }: Props) {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const onPress = useCallback(async () => {
    if (disabled || loading) return;
    setLoading(true);
    onError?.('');
    try {
      const redirectUrl = clerkOAuthRedirectUrl();
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return;
      }
      onError?.('Google sign-in was cancelled or did not complete.');
    } catch (e: unknown) {
      onError?.(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [disabled, loading, onError, startSSOFlow]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      onPress={() => void onPress()}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: palette.glassBorder,
          backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
          opacity: disabled || loading ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.googleMark}>G</Text>
        <Text style={[TYPO.callout, styles.label, { color: palette.text }]}>
          {loading ? 'Opening Google…' : 'Continue with Google'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  googleMark: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: BRAND.qualityBlueLight,
  },
  label: { fontWeight: '600' },
});
