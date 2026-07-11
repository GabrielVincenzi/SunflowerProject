import { AppReadyGate } from '@/components/layoutcomp/AppReadyGate';
import { LanguageProvider } from '@/components/layoutcomp/LanguageContext';
import { useAppState } from '@/services/useAppState';
import { useOnlineManager } from '@/services/useOnlineManager';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import React from 'react';
import { AppStateStatus, Platform, StatusBar } from "react-native";
import './globals.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }
  }
})

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch { }
  },
};

function onAppStateChange(status: AppStateStatus) {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

const Layout = () => {
  const { isSignedIn } = useAuth();

  return (
    <>
      <StatusBar hidden={false} barStyle="dark-content" />
      <Stack>
        <Stack.Protected guard={!!isSignedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(sponsorship)" options={{ headerShown: false }} />
          <Stack.Screen name="infos/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="categories/[cat]" options={{ headerShown: false }} />
          <Stack.Screen name="categories/recomm" options={{ headerShown: false }} />
          <Stack.Screen name="categories/random" options={{ headerShown: false }} />
          <Stack.Screen name="specific/municipality" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(preauth)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  useOnlineManager();
  useAppState(onAppStateChange);

  const [fontsLoaded] = useFonts({
    "Geist-Regular": require("../assets/fonts/Geist-Regular.ttf"),
    "Geist-ExtraBold": require("../assets/fonts/Geist-ExtraBold.ttf"),
    "Geist-ExtraLight": require("../assets/fonts/Geist-ExtraLight.ttf"),
    "Elms-Regular": require("../assets/fonts/ElmsSans-Regular.ttf"),
    "Elms-ExtraBold": require("../assets/fonts/ElmsSans-ExtraBold.ttf"),
    "Elms-Bold": require("../assets/fonts/ElmsSans-Bold.ttf"),
    "Elms-ExtraLight": require("../assets/fonts/ElmsSans-ExtraLight.ttf"),
    "Elms-Thin": require("../assets/fonts/ElmsSans-Thin.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AppReadyGate>
            <Layout />
          </AppReadyGate>
        </QueryClientProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}