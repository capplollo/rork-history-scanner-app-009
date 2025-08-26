import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HistoryProvider } from "@/providers/HistoryProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { trpc, trpcClient } from "@/lib/trpc";
import { cleanupLocalStorage } from "@/lib/supabase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Authentication guard component
function AuthGuard() {
  const { user, session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastRedirectRef = useRef<string | null>(null);

  const currentPath = useMemo(() => {
    return segments.join('/');
  }, [segments]);

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    console.log('AuthGuard check:', { 
      user: !!user, 
      session: !!session, 
      currentPath, 
      emailConfirmed: user?.email_confirmed_at,
      lastRedirect: lastRedirectRef.current 
    });

    let targetPath: string | null = null;

    // Determine target path based on auth state
    if (!user && !session) {
      // User is not authenticated, redirect to login
      if (currentPath !== 'login' && currentPath !== 'signup' && currentPath !== 'forgot-password') {
        targetPath = '/login';
      }
    } else if (user && !user.email_confirmed_at) {
      // User is authenticated but email not confirmed, redirect to email confirmation
      if (currentPath !== 'email-confirmation') {
        targetPath = '/email-confirmation';
      }
    } else if (user && user.email_confirmed_at) {
      // User is authenticated and email confirmed
      if (currentPath === 'login' || currentPath === 'signup' || currentPath === 'email-confirmation' || currentPath === 'forgot-password') {
        targetPath = '/(tabs)';
      }
    }

    // Only redirect if we have a target and it's different from last redirect
    if (targetPath && targetPath !== lastRedirectRef.current) {
      console.log('Redirecting to:', targetPath);
      lastRedirectRef.current = targetPath;
      
      // Use a small delay to ensure state is properly updated
      setTimeout(() => {
        router.replace(targetPath);
      }, 100);
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
        console.log('✅ Storage cleanup completed');
      } catch (error) {
        console.error('❌ Storage cleanup failed:', error);
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
