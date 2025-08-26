import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function EmailConfirmationScreen() {
  const [isResending, setIsResending] = useState(false);
  const [isCheckingConfirmation, setIsCheckingConfirmation] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { user, refreshSession } = useAuth();

  const handleResendConfirmation = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'No email address found');
      return;
    }

    setIsResending(true);
    try {
      // Note: Supabase doesn't have a direct resend confirmation method
      // We'll show a message to the user
      Alert.alert(
        'Confirmation Email',
        'If you haven&apos;t received the confirmation email, please check your spam folder or try signing up again.',
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Try Again', 
            onPress: () => router.replace('/signup') 
          }
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to resend confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  // Auto-check for email confirmation every few seconds
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let authListener: any;

    const startAutoCheck = () => {
      // Check immediately
      checkEmailConfirmation();
      
      // Then check every 3 seconds
      intervalId = setInterval(() => {
        checkEmailConfirmation();
      }, 3000);

      // Also listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change in email confirmation:', event, !!session?.user?.email_confirmed_at);
        
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          setIsConfirmed(true);
          clearInterval(intervalId);
          
          // Show success message and redirect
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1500);
        }
      });
      
      authListener = subscription;
    };

    startAutoCheck();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  const checkEmailConfirmation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        setIsConfirmed(true);
        // Redirect after showing success state
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      }
    } catch (err) {
      console.log('Error checking email confirmation:', err);
    }
  };

  const handleCheckEmail = async () => {
    setIsCheckingConfirmation(true);
    try {
      await refreshSession();
      await checkEmailConfirmation();
      
      if (!isConfirmed) {
        Alert.alert(
          'Email Not Confirmed Yet',
          'Please check your email inbox (and spam folder) for the confirmation link. Click the link to verify your account.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch {
      Alert.alert(
        'Check Your Email',
        'Please check your email inbox (and spam folder) for the confirmation link. Click the link to verify your account.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsCheckingConfirmation(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isConfirmed ? (
            <CheckCircle size={80} color="#4CAF50" />
          ) : (
            <Mail size={80} color="#8B4513" />
          )}
        </View>

        <Text style={styles.title}>
          {isConfirmed ? 'Email Confirmed!' : 'Check Your Email'}
        </Text>
        
        {isConfirmed ? (
          <>
            <Text style={styles.subtitle}>
              Your email has been successfully confirmed!
            </Text>
            
            <Text style={styles.email}>{user?.email}</Text>

            <Text style={styles.description}>
              Redirecting you to the app...
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              We&apos;ve sent a confirmation link to:
            </Text>
            
            <Text style={styles.email}>{user?.email}</Text>

            <Text style={styles.description}>
              Please check your email and click the confirmation link to verify your account. 
              We&apos;re automatically checking for confirmation...
            </Text>
          </>
        )}

        <View style={styles.buttonContainer}>
          {!isConfirmed && (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleCheckEmail}
              disabled={isCheckingConfirmation}
            >
              {isCheckingConfirmation ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>I&apos;ve Confirmed My Email</Text>
              )}
            </TouchableOpacity>
          )}

          {!isConfirmed && (
            <>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handleResendConfirmation}
                disabled={isResending}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#8B4513" />
                ) : (
                  <RefreshCw size={20} color="#8B4513" />
                )}
                <Text style={styles.secondaryButtonText}>
                  {isResending ? 'Resending...' : 'Resend Confirmation'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.textButton} 
                onPress={handleBackToLogin}
              >
                <Text style={styles.textButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#FFF8F0',
    borderRadius: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Times New Roman',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Times New Roman',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Times New Roman',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 10,
    fontFamily: 'Times New Roman',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Times New Roman',
  },
  secondaryButton: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Times New Roman',
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Times New Roman',
  },
});
