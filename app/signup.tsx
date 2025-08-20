import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { router, useNavigation } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react-native';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigation = useNavigation();
  
  const { signUp } = useAuth();

  const handleGoBack = () => {
    try {
      if (navigation.canGoBack()) {
        router.back();
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      router.replace('/login');
    }
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    console.log('Attempting signup for:', email);
    
    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        console.error('Sign up error:', {
          message: error.message || 'No message',
          name: error.name || 'No name',
          stack: error.stack || 'No stack',
          fullError: JSON.stringify(error, null, 2)
        });
        let errorMessage = 'An unexpected error occurred during sign up';
        
        // Handle specific error types
        if (error.message) {
          if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
            errorMessage = 'An account with this email already exists. Please try signing in instead.';
          } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Please enter a valid email address.';
          } else if (error.message.includes('Password should be at least')) {
            errorMessage = 'Password must be at least 6 characters long.';
          } else if (error.message.includes('Unable to validate email address')) {
            errorMessage = 'Please enter a valid email address.';
          } else if (error.message.includes('Signup is disabled')) {
            errorMessage = 'Signup is currently disabled. Please contact support.';
          } else {
            errorMessage = error.message;
          }
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = 'Please check your internet connection and try again.';
        }
        
        Alert.alert('Sign Up Failed', errorMessage);
      } else {
        console.log('Signup successful');
        // Redirect to email confirmation page instead of showing alert
        router.replace('/email-confirmation');
      }
    } catch (error) {
      console.error('Unexpected signup error:', {
        message: error instanceof Error ? error.message : String(error),
        type: typeof error,
        fullError: JSON.stringify(error, null, 2)
      });
      Alert.alert('Sign Up Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    handleGoBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
            <ArrowLeft size={24} color="#8B4513" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to discover amazing monuments</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                testID="fullname-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                testID="toggle-password"
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                testID="confirm-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                testID="toggle-confirm-password"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              testID="signup-button"
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin} testID="login-link">
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    fontWeight: '400' as const,
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    color: '#2C3E50',
  },
  eyeIcon: {
    padding: 4,
  },
  signupButton: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonDisabled: {
    backgroundColor: '#ccc',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    fontWeight: '500' as const,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
  },
  loginLink: {
    color: '#8B4513',
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    fontWeight: '500' as const,
  },
});