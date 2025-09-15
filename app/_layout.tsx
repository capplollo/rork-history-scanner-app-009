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
  const { user, loading } = useAuth();
  const lastRedirectRef = useRef<string | null>(null);

  const currentPath = useMemo(() => {
    return segments.join('/');
  }, [segments]);

  const inAuthGroup = useMemo(() => {
    return segments[0] === '(tabs)';
  }, [segments]);

  useEffect(() => {
    if (loading) return;

    console.log('AuthGuard check:', { 
      currentPath, 
      user: user?.email,
      inAuthGroup,
      lastRedirect: lastRedirectRef.current 
    });

    if (!user && inAuthGroup && lastRedirectRef.current !== '/login') {
      lastRedirectRef.current = '/login';
      router.replace('/login');
    } else if (user && !inAuthGroup && currentPath !== 'email-confirmation' && lastRedirectRef.current !== '/(tabs)') {
      lastRedirectRef.current = '/(tabs)';
      router.replace('/(tabs)/' as any);
    }
  }, [user, loading, currentPath, inAuthGroup, router]);

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
    <AuthProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="dark" backgroundColor={Colors.background} translucent={false} />
        <AuthGuard />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
