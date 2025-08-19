import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HistoryProvider } from "@/providers/HistoryProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import { cleanupLocalStorage } from "@/lib/supabase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Authentication guard component
function AuthGuard() {
  const { user, session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !session) {
      // User is not authenticated, redirect to login
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else if (user && !user.email_confirmed_at) {
      // User is authenticated but email not confirmed, redirect to email confirmation
      if (!inAuthGroup) {
        router.replace('/email-confirmation');
      }
    } else if (user && user.email_confirmed_at && inAuthGroup) {
      // User is authenticated and email confirmed, redirect to main app
      router.replace('/(tabs)');
    }
  }, [user, session, loading, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="scan-result" 
        options={{ 
          presentation: "modal",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="email-confirmation" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="chat-modal" 
        options={{ 
          presentation: "modal",
          headerShown: false 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Clean up storage on app start to prevent quota issues
        await cleanupLocalStorage();
        console.log('Storage cleanup completed');
      } catch (error) {
        console.error('Storage cleanup failed:', error);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <AuthGuard />
            <HistoryProvider>
              <ChatProvider>
                <RootLayoutNav />
              </ChatProvider>
            </HistoryProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
