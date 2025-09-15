import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, Component, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, Text } from "react-native";
import { Colors } from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={styles.errorHint}>
            Please check your environment configuration and restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

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
        console.log('Environment check:', {
          supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
          supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
        });
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <GestureHandlerRootView style={styles.container}>
          <StatusBar style="dark" backgroundColor={Colors.background} translucent={false} />
          <AuthGuard />
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  errorHint: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
});
