import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { AuthProvider, useAuth } from "@/components/AuthContext";

SplashScreen.preventAutoHideAsync();

// Authentication guard component
function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const lastRedirectRef = useRef<string | null>(null);
  const { isAuthenticated, isLoading } = useAuth();

  const currentPath = useMemo(() => {
    return segments.join('/');
  }, [segments]);

  const inAuthGroup = useMemo(() => {
    return ['login', 'signup', 'forgot-password', 'email-confirmation'].includes(segments[0] || '');
  }, [segments]);

  useEffect(() => {
    if (isLoading) return;

    console.log('AuthGuard check:', { 
      currentPath, 
      isAuthenticated,
      inAuthGroup,
      lastRedirect: lastRedirectRef.current 
    });

    const targetPath = `/${currentPath}`;

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and trying to access protected route
      if (lastRedirectRef.current !== '/login') {
        console.log('Redirecting to login from:', targetPath);
        lastRedirectRef.current = '/login';
        router.replace('/login');
      }
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on auth screen
      if (lastRedirectRef.current !== '/(tabs)') {
        console.log('Redirecting to tabs from:', targetPath);
        lastRedirectRef.current = '/(tabs)';
        router.replace('/');
      }
    } else {
      // Clear redirect tracking when user is in correct state
      lastRedirectRef.current = null;
    }
  }, [currentPath, isAuthenticated, inAuthGroup, isLoading, router]);

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
      </View>
    );
  }

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

function AppContent() {
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
      <StatusBar style="dark" translucent={false} />
      <AuthGuard />
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
