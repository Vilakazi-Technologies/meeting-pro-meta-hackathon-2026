import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { GlassCard } from '../GlassCard';
import { GlassInput } from '../GlassInput';
import { GlassPrimaryButton } from '../GlassPrimaryButton';
import { ClerkGoogleSignInButton } from './ClerkGoogleSignInButton';
import { AuthDivider } from './AuthDivider';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, FONT, SPACING } from '../../constants/theme';

type AuthMode = 'sign-in' | 'sign-up' | 'verify-email';

function clerkErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'errors' in e) {
    const errs = (e as { errors: { message?: string; longMessage?: string }[] }).errors;
    if (errs?.[0]?.longMessage) return errs[0].longMessage;
    if (errs?.[0]?.message) return errs[0].message;
  }
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

export function NativeClerkAuth() {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoaded = signInLoaded && signUpLoaded;
  const canSubmit =
    isLoaded &&
    email.trim().length > 0 &&
    (mode === 'verify-email' ? code.trim().length >= 6 : password.length > 0) &&
    !submitting;

  const resetError = () => setError(null);

  const switchMode = (next: AuthMode) => {
    resetError();
    setCode('');
    setMode(next);
  };

  const handleSignIn = async () => {
    if (!signIn || !canSubmit) return;
    setSubmitting(true);
    resetError();
    try {
      // Identifier first — password in create() breaks Google-only / email-code accounts.
      const attempt = await signIn.create({ identifier: email.trim() });

      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setSignInActive({ session: attempt.createdSessionId });
        return;
      }

      const factors = attempt.supportedFirstFactors ?? [];
      const passwordAllowed = factors.some((f) => f.strategy === 'password');

      if (!passwordAllowed) {
        const google = factors.some((f) => f.strategy === 'oauth_google');
        setError(
          google
            ? 'This account uses Google sign-in. Tap Continue with Google above.'
            : 'This email uses a different sign-in method. Try Google or contact VILATECH support.'
        );
        return;
      }

      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId });
        return;
      }

      if (result.status === 'needs_second_factor') {
        setError('Complete two-factor verification using the code Clerk sent you.');
        return;
      }

      setError('Sign-in could not be completed. Contact your VILATECH administrator.');
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUp || !canSubmit) return;
    setSubmitting(true);
    resetError();
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      switchMode('verify-email');
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!signUp || !canSubmit) return;
    setSubmitting(true);
    resetError();
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        return;
      }
      setError('Verification incomplete. Check the code and try again.');
    } catch (e: unknown) {
      setError(clerkErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = () => {
    if (mode === 'sign-in') void handleSignIn();
    else if (mode === 'sign-up') void handleSignUp();
    else void handleVerifyEmail();
  };

  const title =
    mode === 'sign-in'
      ? 'Sign in'
      : mode === 'sign-up'
        ? 'Create account'
        : 'Verify your email';

  const buttonLabel =
    mode === 'sign-in'
      ? 'Sign in to Meeting Pro'
      : mode === 'sign-up'
        ? 'Continue'
        : 'Verify and continue';

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => switchMode('sign-in')}
          style={[styles.tab, mode === 'sign-in' && styles.tabActive]}
        >
          <Text style={[styles.tabText, { color: palette.textSecondary }, mode === 'sign-in' && styles.tabTextActive]}>
            Sign in
          </Text>
        </Pressable>
        <Pressable
          onPress={() => switchMode('sign-up')}
          style={[styles.tab, mode === 'sign-up' && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              { color: palette.textSecondary },
              (mode === 'sign-up' || mode === 'verify-email') && styles.tabTextActive,
            ]}
          >
            Sign up
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.panelTitle, { color: palette.text }]}>{title}</Text>

      {mode !== 'verify-email' ? (
        <>
          <ClerkGoogleSignInButton
            disabled={submitting}
            onError={(msg) => setError(msg || null)}
          />
          <AuthDivider />
        </>
      ) : null}

      <GlassCard style={styles.formCard}>
        {mode !== 'verify-email' ? (
          <>
            <GlassInput
              testID="auth-email"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@company.com"
              editable={!submitting}
            />
            <GlassInput
              testID="auth-password"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              autoComplete={mode === 'sign-up' ? 'password-new' : 'password'}
              textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
              placeholder={mode === 'sign-up' ? 'Create a password' : 'Your password'}
              editable={!submitting}
              onSubmitEditing={onSubmit}
            />
          </>
        ) : (
          <GlassInput
            testID="auth-code"
            label="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            placeholder="6-digit code from email"
            editable={!submitting}
            onSubmitEditing={onSubmit}
          />
        )}

        {error ? (
          <Text testID="auth-error" style={[styles.error, { color: palette.error }]}>
            {error}
          </Text>
        ) : null}
      </GlassCard>

      <GlassPrimaryButton
        testID="auth-submit"
        label={buttonLabel}
        onPress={onSubmit}
        disabled={!canSubmit}
        loading={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: SPACING.md },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  tabText: { fontSize: FONT.sm, fontWeight: '600' },
  tabTextActive: { color: '#F8FAFC' },
  panelTitle: {
    fontSize: FONT.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  formCard: { gap: 0 },
  error: { fontSize: FONT.sm, marginTop: SPACING.xs, lineHeight: 20 },
});
