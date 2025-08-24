import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook((): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const loadingRef = useRef<boolean>(true);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session with timeout
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          loadingRef.current = false;
          console.log('AuthProvider: Initial auth state set', { hasSession: !!session, hasUser: !!session?.user });
        }
      } catch (error) {
        console.error('AuthProvider: Failed to initialize auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };
    
    // Set a timeout to ensure loading state doesn't persist indefinitely
    const timeoutId = setTimeout(() => {
      if (mounted && loadingRef.current) {
        console.warn('AuthProvider: Auth initialization timeout, setting loading to false');
        setLoading(false);
        loadingRef.current = false;
      }
    }, 5000);
    
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthProvider: Auth state changed', { event: _event, hasSession: !!session });
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        loadingRef.current = false;
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      console.log('Starting signup process for:', email);
      
      // Get the current URL for redirect
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/email-confirmation`
        : 'exp://localhost:8081/--/email-confirmation';
      
      console.log('Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Auth signup error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          details: JSON.stringify(error, null, 2)
        });
        return { error };
      }

      if (data.user) {
        console.log('User created successfully:', {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at,
          createdAt: data.user.created_at
        });
        
        // Check if profile was created by trigger
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, customer_id')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.warn('Profile not found immediately after signup:', profileError.message);
            // Wait a bit longer for the trigger to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try again
            const { data: retryProfile, error: retryError } = await supabase
              .from('profiles')
              .select('id, customer_id')
              .eq('id', data.user.id)
              .single();
              
            if (retryError) {
              console.error('Profile creation failed even after retry:', retryError);
              // The trigger might have failed, but we still return success
              // The user can still sign up, profile creation can be handled later
            } else {
              console.log('Profile created successfully on retry:', retryProfile);
            }
          } else {
            console.log('Profile created successfully:', profile);
          }
        } catch (profileCheckError) {
          console.warn('Error checking profile creation:', profileCheckError);
          // Don't fail the signup process if we can't check the profile
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected signup error:', {
        message: error instanceof Error ? error.message : String(error),
        type: typeof error,
        stack: error instanceof Error ? error.stack : undefined
      });
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting sign out process...');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        setLoading(false);
        return { error };
      }
      
      // Clear local state after successful Supabase signout
      // The onAuthStateChange listener will handle this automatically
      // but we can also clear it manually for immediate feedback
      setUser(null);
      setSession(null);
      
      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Unexpected signOut error:', error);
      setLoading(false);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
  }), [user, session, loading, signUp, signIn, signOut, resetPassword, refreshSession]);
});