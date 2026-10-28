import React, { useState, useCallback } from 'react';
import { Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { DATA_SOURCE, isSupabaseConfigured } from './lib/supabaseConfig';
import { SupabaseSetupScreen } from './screens/SupabaseSetupScreen';
import { RootNavigator } from './navigation/RootNavigator';
import { LoadingScreen } from './screens/LoadingScreen';
import { SignInScreen } from './screens/SignInScreen';
import { WebAppFrame } from './components/WebAppFrame';
import { getClerkPublishableKey } from './lib/clerkEnv';
import { clerkAppOrigin } from './lib/clerkRedirectUrls';
import { meetingProClerkLocalization } from './lib/clerkLocalization';
import { vilatechClerkAppearance } from './lib/clerkAppearance';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const clerkPublishableKey = getClerkPublishableKey();
if (!clerkPublishableKey) {
  throw new Error(
    'Clerk is not configured: set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY on Vercel) in .env — see .env.example.'
  );
}

/** Web: tell Clerk where the SPA lives (Vercel), not clerk.accounts.dev. */
const clerkWebRedirects =
  Platform.OS === 'web'
    ? {
        signInFallbackRedirectUrl: `${clerkAppOrigin()}/`,
        signUpFallbackRedirectUrl: `${clerkAppOrigin()}/`,
        afterSignOutUrl: `${clerkAppOrigin()}/`,
      }
    : {};

function AppContent() {
  const { effectiveTheme } = useTheme();
  const { isSignedIn, initializing } = useAuth();
  const [booting, setBooting] = useState(true);

  const handleLoadFinish = useCallback(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    setBooting(false);
  }, []);

  if (booting || initializing) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <LoadingScreen onFinish={handleLoadFinish} />
      </>
    );
  }

  const barStyle = effectiveTheme === 'dark' ? 'light-content' : 'dark-content';

  if (!isSignedIn) {
    return (
      <>
        <StatusBar barStyle={barStyle} />
        <SignInScreen />
      </>
    );
  }

  if (DATA_SOURCE === 'supabase' && !isSupabaseConfigured()) {
    return (
      <>
        <StatusBar barStyle={barStyle} />
        <SupabaseSetupScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={barStyle} />
      <SupabaseProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SupabaseProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, minHeight: 0 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          localization={meetingProClerkLocalization}
          appearance={vilatechClerkAppearance}
          tokenCache={Platform.OS === 'web' ? undefined : tokenCache}
          {...clerkWebRedirects}
        >
          <ClerkLoaded>
            <ThemeProvider>
              <AuthProvider>
                <WebAppFrame>
                  <AppContent />
                </WebAppFrame>
              </AuthProvider>
            </ThemeProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
