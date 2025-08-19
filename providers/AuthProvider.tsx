import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

export const [AuthProvider, useAuth] = createContextHook((): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Auth signup error:', error);
        return { error };
      }

      if (data.user) {
        console.log('User created successfully, ID:', data.user.id);
        
        // Try to create profile in database (this might fail if table doesn't exist)
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName || null,
            });

          if (profileError) {
            console.error('Error creating profile:', {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code,
            });
            
            // Check if it's a table not found error
            if (profileError.code === 'PGRST116' || profileError.message?.includes('relation "profiles" does not exist')) {
              console.warn('Profiles table does not exist, continuing without profile creation');
              // Continue without creating profile - user account is still created
              return { error: null };
            }
            
            // For other profile creation issues, log but don't fail signup
            console.warn('Profile creation failed but user account was created:', profileError.message);
            return { error: null };
          }
          
          console.log('Profile created successfully');
        } catch (profileError) {
          console.warn('Profile creation failed but user account was created:', profileError);
          return { error: null };
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
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
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
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

  return useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }), [user, session, loading, signUp, signIn, signOut, resetPassword]);
});