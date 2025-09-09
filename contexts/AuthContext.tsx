import { useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
}

type AuthContextType = AuthState & AuthActions;

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        } else if (mounted) {
          console.log('Initial session:', initialSession?.user?.email || 'No session');
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email || 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Store user info for offline access
          await AsyncStorage.setItem('user_email', session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          // Clear stored user info
          await AsyncStorage.removeItem('user_email');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Signing in user:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error.message);
      } else {
        console.log('Sign in successful');
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      console.log('Signing up user:', email);
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
      } else {
        console.log('Sign up successful - confirmation email sent');
      }
      
      return { error };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error.message);
      } else {
        console.log('Sign out successful');
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      console.log('Resetting password for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'your-app://reset-password',
        }
      );
      
      if (error) {
        console.error('Reset password error:', error.message);
      } else {
        console.log('Reset password email sent');
      }
      
      return { error };
    } catch (error) {
      console.error('Reset password exception:', error);
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      console.log('Resending confirmation for:', email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      
      if (error) {
        console.error('Resend confirmation error:', error.message);
      } else {
        console.log('Confirmation email resent');
      }
      
      return { error };
    } catch (error) {
      console.error('Resend confirmation exception:', error);
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(() => ({
    user,
    session,
    isLoading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
  }), [user, session, isLoading, isInitialized, signIn, signUp, signOut, resetPassword, resendConfirmation]);
});