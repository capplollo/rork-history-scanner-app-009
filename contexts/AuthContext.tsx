import { useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScanHistoryItem {
  id: string;
  name: string;
  location: string;
  period: string;
  image: string;
  scannedAt: string;
  confidence: number;
  description: string;
  userId: string;
}

interface UserStats {
  totalScans: number;
  uniqueCountries: number;
  level: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  scanHistory: ScanHistoryItem[];
  userStats: UserStats;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  addScanToHistory: (scan: Omit<ScanHistoryItem, 'id' | 'userId' | 'scannedAt'>) => Promise<void>;
  clearUserData: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalScans: 0,
    uniqueCountries: 0,
    level: 1
  });

  // Load user data from AsyncStorage
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const historyKey = `scanHistory_${userId}`;
      const statsKey = `userStats_${userId}`;
      
      const [historyData, statsData] = await Promise.all([
        AsyncStorage.getItem(historyKey),
        AsyncStorage.getItem(statsKey)
      ]);
      
      if (historyData) {
        const history = JSON.parse(historyData) as ScanHistoryItem[];
        setScanHistory(history);
      }
      
      if (statsData) {
        const stats = JSON.parse(statsData) as UserStats;
        setUserStats(stats);
      } else {
        // Initialize default stats for new users
        const defaultStats = { totalScans: 0, uniqueCountries: 0, level: 1 };
        setUserStats(defaultStats);
        await AsyncStorage.setItem(statsKey, JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Clear user data
  const clearUserData = useCallback(async () => {
    setScanHistory([]);
    setUserStats({ totalScans: 0, uniqueCountries: 0, level: 1 });
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!event || typeof event !== 'string') return;
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          await clearUserData();
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData, clearUserData]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
      return { error: { message: 'All fields are required' } as AuthError };
    }
    if (email.length > 100 || password.length > 100 || fullName.length > 100) {
      return { error: { message: 'Input too long' } as AuthError };
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      return { error: { message: 'Email and password are required' } as AuthError };
    }
    if (email.length > 100 || password.length > 100) {
      return { error: { message: 'Input too long' } as AuthError };
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
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
      await clearUserData();
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, [clearUserData]);

  const resetPassword = useCallback(async (email: string) => {
    if (!email?.trim()) {
      return { error: { message: 'Email is required' } as AuthError };
    }
    if (email.length > 100) {
      return { error: { message: 'Email too long' } as AuthError };
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${process.env.EXPO_PUBLIC_SITE_URL}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  // Add scan to history
  const addScanToHistory = useCallback(async (scan: Omit<ScanHistoryItem, 'id' | 'userId' | 'scannedAt'>) => {
    if (!user) return;
    
    try {
      const newScan: ScanHistoryItem = {
        ...scan,
        id: Date.now().toString(),
        userId: user.id,
        scannedAt: new Date().toISOString()
      };
      
      const updatedHistory = [newScan, ...scanHistory];
      setScanHistory(updatedHistory);
      
      // Calculate new stats
      const countries = new Set(updatedHistory.map(item => item.location.split(',').pop()?.trim()));
      const newStats: UserStats = {
        totalScans: updatedHistory.length,
        uniqueCountries: countries.size,
        level: Math.floor(updatedHistory.length / 5) + 1 // Level up every 5 scans
      };
      setUserStats(newStats);
      
      // Save to AsyncStorage
      const historyKey = `scanHistory_${user.id}`;
      const statsKey = `userStats_${user.id}`;
      
      await Promise.all([
        AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory)),
        AsyncStorage.setItem(statsKey, JSON.stringify(newStats))
      ]);
    } catch (error) {
      console.error('Error adding scan to history:', error);
    }
  }, [user, scanHistory]);

  return useMemo(() => ({
    user,
    session,
    loading,
    scanHistory,
    userStats,
    signUp,
    signIn,
    signOut,
    resetPassword,
    addScanToHistory,
    clearUserData,
  }), [user, session, loading, scanHistory, userStats, signUp, signIn, signOut, resetPassword, addScanToHistory, clearUserData]);
});

// Export types for use in other components
export type { ScanHistoryItem, UserStats };