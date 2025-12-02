import { useAppState } from '@/services/useAppState';
import { useOnlineManager } from '@/services/useOnlineManager';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from "expo-router";
import React from 'react';
import { AppStateStatus, Platform, StatusBar } from "react-native";
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    }
  }
})

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
      <StatusBar hidden={true} />
      <Stack>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="infos/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="categories/[cat]" options={{ headerShown: false }} />
        <Stack.Screen name="categories/recomm" options={{ headerShown: false }} />
        <Stack.Screen name="categories/random" options={{ headerShown: false }} />
      </Stack>
    </>
  )

}

export default function RootLayout() {
  useOnlineManager()
  useAppState(onAppStateChange)

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <Layout />
      </QueryClientProvider>
    </ClerkProvider>
  )
}