import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Configure Expo WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

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

// Polyfill for window (ensure it runs first)
if (typeof global.window === 'undefined') {
  // @ts-ignore
  global.window = global;
}

// window.location polyfill is temporarily removed for testing OAuth flow.

// Polyfill for CustomEvent - Centralized here
if (typeof global.CustomEvent !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class CustomEventPolyfill<T = any> {
    type: string;
    detail: T | null;
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;

    constructor(type: string, eventInitDict?: CustomEventInit<T>) {
      this.type = type;
      this.detail = eventInitDict?.detail ?? null;
      this.bubbles = eventInitDict?.bubbles ?? false;
      this.cancelable = eventInitDict?.cancelable ?? false;
      this.composed = eventInitDict?.composed ?? false;
    }
  }
  // @ts-ignore
  global.CustomEvent = CustomEventPolyfill;
  // @ts-ignore
  if (global.window) {
    // @ts-ignore
    global.window.CustomEvent = CustomEventPolyfill;
  }
}


// Polyfill for window.dispatchEvent
if (global.window && typeof global.window.dispatchEvent !== 'function') {
  // @ts-ignore
  global.window.dispatchEvent = function(event: global.CustomEvent) {
    // console.log('Polyfilled window.dispatchEvent for event type:', event?.type);
    // This is a basic polyfill. If Clerk relies on actual event listener notification
    // through window.addEventListener, this might need to be more sophisticated.
    return true;
  };
}

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
