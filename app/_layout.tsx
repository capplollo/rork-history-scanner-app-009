import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

// Authentication guard component
function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const lastRedirectRef = useRef<string | null>(null);

  const currentPath = useMemo(() => {
    return segments.join('/');
  }, [segments]);

  useEffect(() => {
    console.log('AuthGuard check:', { 
      currentPath, 
      lastRedirect: lastRedirectRef.current 
    });

<<<<<<< HEAD
    // For now, just allow access to all routes
    // You can implement authentication logic here later
  }, [currentPath, router]);
=======
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
      router.replace(targetPath);
    }
  }, [user, session, loading, currentPath, router]);
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611

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
        console.log('App initialized');
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthGuard />
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}
