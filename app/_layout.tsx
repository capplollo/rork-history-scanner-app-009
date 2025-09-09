import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

// Authentication guard component
function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const lastRedirectRef = useRef<string | null>(null);
  const { user, isInitialized } = useAuth();

  const currentPath = useMemo(() => {
    return segments.join('/');
  }, [segments]);

  const inAuthGroup = useMemo(() => {
    return segments[0] === '(tabs)';
  }, [segments]);

  const isAuthPage = useMemo(() => {
    return ['login', 'signup', 'forgot-password', 'email-confirmation'].includes(segments[0] || '');
  }, [segments]);

  useEffect(() => {
    if (!isInitialized) return;

    console.log('AuthGuard check:', { 
      currentPath, 
      user: user?.email || 'No user',
      inAuthGroup,
      isAuthPage,
      lastRedirect: lastRedirectRef.current 
    });

    const targetPath = `/${currentPath}`;

    if (user && !user.email_confirmed_at && !isAuthPage) {
      // User exists but email not confirmed, redirect to email confirmation
      if (targetPath !== '/email-confirmation' && lastRedirectRef.current !== '/email-confirmation') {
        console.log('Redirecting to email confirmation');
        lastRedirectRef.current = '/email-confirmation';
        router.replace('/email-confirmation');
      }
    } else if (user && user.email_confirmed_at && (isAuthPage || currentPath === '')) {
      // User is authenticated and confirmed, redirect to main app
      if (targetPath !== '/(tabs)' && lastRedirectRef.current !== '/(tabs)') {
        console.log('Redirecting authenticated user to main app');
        lastRedirectRef.current = '/(tabs)';
        router.replace('/(tabs)/' as any);
      }
    } else if (!user && inAuthGroup) {
      // User not authenticated, redirect to login
      if (targetPath !== '/login' && lastRedirectRef.current !== '/login') {
        console.log('Redirecting unauthenticated user to login');
        lastRedirectRef.current = '/login';
        router.replace('/login');
      }
    } else if (!user && currentPath === '') {
      // No user and on root, redirect to login
      if (targetPath !== '/login' && lastRedirectRef.current !== '/login') {
        console.log('Redirecting to login from root');
        lastRedirectRef.current = '/login';
        router.replace('/login');
      }
    }
  }, [currentPath, user, isInitialized, inAuthGroup, isAuthPage, router]);

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
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background} translucent={false} />
      <AuthProvider>
        <AuthGuard />
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
