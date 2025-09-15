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
  refreshScanHistory: () => Promise<void>;
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

  // Create scan_history table if it doesn't exist
  const createScanHistoryTable = useCallback(async () => {
    try {
      // This will create the table if it doesn't exist
      // Note: In production, you should create tables via Supabase dashboard or migrations
      const { error } = await supabase.rpc('create_scan_history_table_if_not_exists');
      if (error && !error.message.includes('already exists')) {
        console.log('Table creation result:', error);
      }
    } catch (error) {
      // Table might already exist or RPC might not be available
      console.log('Table creation attempt:', error);
    }
  }, []);
  
  // Migrate AsyncStorage data to Supabase
  const migrateToSupabase = useCallback(async (history: ScanHistoryItem[], userId: string) => {
    try {
      console.log('Migrating', history.length, 'items to Supabase');
      
      for (const item of history) {
        const { error } = await supabase
          .from('scan_history')
          .insert({
            id: item.id,
            user_id: userId,
            name: item.name,
            location: item.location,
            period: item.period,
            image: item.image,
            scanned_at: item.scannedAt,
            confidence: item.confidence,
            description: item.description
          });
        
        if (error && !error.message.includes('duplicate key')) {
          console.error('Error migrating item:', error);
        }
      }
      
      console.log('Migration completed');
    } catch (error) {
      console.error('Error during migration:', error);
    }
  }, []);
  
  // Fallback function to load from AsyncStorage
  const loadFromAsyncStorage = useCallback(async (userId: string) => {
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
        // Migrate to Supabase in background
        migrateToSupabase(history, userId);
      }
      
      if (statsData) {
        const stats = JSON.parse(statsData) as UserStats;
        setUserStats(stats);
      } else {
        // Initialize default stats for new users
        const defaultStats = { totalScans: 0, uniqueCountries: 0, level: 1 };
        setUserStats(defaultStats);
      }
    } catch (error) {
      console.error('Error loading from AsyncStorage:', error);
    }
  }, [migrateToSupabase]);

  // Load user data from Supabase and fallback to AsyncStorage
  const loadUserData = useCallback(async (userId: string) => {
    try {
      console.log('Loading user data for:', userId);
      
      // First, try to create the scan_history table if it doesn't exist
      await createScanHistoryTable();
      
      // Load scan history from Supabase
      const { data: historyData, error: historyError } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });
      
      if (historyError) {
        console.error('Error loading history from Supabase:', historyError);
        // Fallback to AsyncStorage
        await loadFromAsyncStorage(userId);
        return;
      }
      
      console.log('📊 Loaded scan history from Supabase:', historyData?.length || 0, 'items');
      
      if (historyData && historyData.length > 0) {
        // Convert Supabase data to our format
        const history: ScanHistoryItem[] = historyData.map(item => ({
          id: item.id,
          name: item.name,
          location: item.location,
          period: item.period,
          image: item.image || '', // Ensure image is never null
          scannedAt: item.scanned_at,
          confidence: item.confidence || 0, // Ensure confidence is never null
          description: item.description || '',
          userId: item.user_id
        }));
        setScanHistory(history);
        
        // Calculate stats from history
        const countries = new Set(history.map(item => item.location.split(',').pop()?.trim()));
        const newStats: UserStats = {
          totalScans: history.length,
          uniqueCountries: countries.size,
          level: Math.floor(history.length / 5) + 1
        };
        setUserStats(newStats);
      } else {
        // No data in Supabase, try AsyncStorage migration
        await loadFromAsyncStorage(userId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to AsyncStorage
      await loadFromAsyncStorage(userId);
    }
  }, [createScanHistoryTable, loadFromAsyncStorage]);
  


  // Refresh scan history
  const refreshScanHistory = useCallback(async () => {
    if (!user) return;
    console.log('🔄 Refreshing scan history for user:', user.email);
    await loadUserData(user.id);
  }, [user, loadUserData]);
  
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
          console.log('🔄 Auth state changed - loading user data for:', session.user.email);
          await loadUserData(session.user.id);
        } else {
          console.log('🔄 Auth state changed - user signed out, clearing data');
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
    if (!user) {
      console.error('❌ Cannot add scan to history: user not logged in');
      return;
    }
    
    try {
      console.log('💾 Adding scan to history:', scan.name);
      
      const newScan: ScanHistoryItem = {
        ...scan,
        id: Date.now().toString(),
        userId: user.id,
        scannedAt: new Date().toISOString()
      };
      
      // Save to Supabase first
      const { error: supabaseError } = await supabase
        .from('scan_history')
        .insert({
          id: newScan.id,
          user_id: user.id,
          name: newScan.name,
          location: newScan.location,
          period: newScan.period,
          image: newScan.image || '', // Ensure image is never null
          scanned_at: newScan.scannedAt,
          confidence: newScan.confidence || 0, // Ensure confidence is never null
          description: newScan.description || ''
        });
      
      if (supabaseError) {
        console.error('❌ Error saving to Supabase:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        });
        // Continue with local storage as fallback - don't throw error
        console.log('⚠️ Continuing with local storage fallback');
      } else {
        console.log('✅ Successfully saved to Supabase');
      }
      
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
      
      // Also save to AsyncStorage as backup
      const historyKey = `scanHistory_${user.id}`;
      const statsKey = `userStats_${user.id}`;
      
      await Promise.all([
        AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory)),
        AsyncStorage.setItem(statsKey, JSON.stringify(newStats))
      ]);
      
      console.log('✅ Scan added to history successfully. Total scans:', updatedHistory.length);
    } catch (error) {
      console.error('❌ Error adding scan to history:', error);
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
    refreshScanHistory,
    clearUserData,
  }), [user, session, loading, scanHistory, userStats, signUp, signIn, signOut, resetPassword, addScanToHistory, refreshScanHistory, clearUserData]);
});

// Export types for use in other components
export type { ScanHistoryItem, UserStats };