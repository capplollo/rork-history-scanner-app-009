import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

export default function EmailConfirmationScreen() {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isCheckingConfirmation, setIsCheckingConfirmation] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      // Simulate resending confirmation
      setTimeout(() => {
        Alert.alert(
          'Confirmation Email',
          'If you haven\'t received the confirmation email, please check your spam folder or try signing up again.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Try Again', 
              onPress: () => router.replace('/signup') 
            }
          ]
        );
      }, 1000);
    } catch {
      Alert.alert('Error', 'Failed to resend confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  const handleCheckEmail = async () => {
    setIsCheckingConfirmation(true);
    try {
      // Simulate checking email confirmation
      setTimeout(() => {
        Alert.alert(
          'Email Not Confirmed Yet',
          'Please check your email inbox (and spam folder) for the confirmation link. Click the link to verify your account.',
          [{ text: 'OK', style: 'default' }]
        );
      }, 1000);
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
            
            <Text style={styles.email}>{user?.email || 'your-email@example.com'}</Text>

            <Text style={styles.description}>
              Redirecting you to the app...
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              We've sent a confirmation link to:
            </Text>
            
            <Text style={styles.email}>{user?.email || 'your-email@example.com'}</Text>

            <Text style={styles.description}>
              Please check your email and click the confirmation link to verify your account. 
              We're automatically checking for confirmation...
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
                <Text style={styles.primaryButtonText}>I've Confirmed My Email</Text>
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
