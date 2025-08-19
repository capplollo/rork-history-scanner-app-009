import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
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

  const currentPath = useMemo(() => segments.join('/'), [segments]);

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    // Prevent infinite loops by checking current path before redirecting
    if (!user && !session) {
      // User is not authenticated, redirect to login
      if (currentPath !== 'login' && currentPath !== 'signup' && currentPath !== 'forgot-password') {
        console.log('Redirecting to login - no user/session');
        router.replace('/login');
      }
    } else if (user && !user.email_confirmed_at) {
      // User is authenticated but email not confirmed, redirect to email confirmation
      if (currentPath !== 'email-confirmation') {
        console.log('Redirecting to email confirmation - email not confirmed');
        router.replace('/email-confirmation');
      }
    } else if (user && user.email_confirmed_at) {
      // User is authenticated and email confirmed
      if (currentPath === 'login' || currentPath === 'signup' || currentPath === 'email-confirmation' || currentPath === 'forgot-password') {
        console.log('Redirecting to main app - user authenticated');
        router.replace('/(tabs)');
      }
    }
  }, [user, session, loading, currentPath, router]);

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
