import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_test_ZXhvdGljLW1hcnRlbi00MS5jbGVyay5hY2NvdW50cy5kZXYk'

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function useProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const isAuthRoute = segments[0] === "sign-in" || segments[0] === "sign-up";

    if (!isSignedIn && !isAuthRoute) {
      router.replace("/sign-in");
    } else if (isSignedIn && isAuthRoute) {
      router.replace("/(tabs)");
    }
  }, [isSignedIn, segments, isLoaded]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ClerkProvider 
      publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <InitialLayout />
      </ThemeProvider>
    </ClerkProvider>
  );
}

function InitialLayout() {
  useProtectedRoute();

  return (
    <>
      <Slot />
      <StatusBar style="auto" />
    </>
  );
}
