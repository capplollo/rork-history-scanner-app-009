import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qgpjmcpnytkewtmjfkzw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGptY3BueXRrZXd0bWpma3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Mzg2MTQsImV4cCI6MjA3MTExNDYxNH0.RDznTdQFOAO6wFVaM3jWBE7yldRTASpoLut-PIzzJZk';

console.log('Environment check:', {
  supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
  supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Not set',
  allEnvVars: Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC'))
});

if (!supabaseUrl) {
  throw new Error('supabaseUrl is required. Please add EXPO_PUBLIC_SUPABASE_URL to your .env file.');
}

if (!supabaseAnonKey) {
  throw new Error('supabaseAnonKey is required. Please add EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.');
}

const supabaseConfig = {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'monument-scanner-app',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);

// Add connection health check
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scan_history')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" which is OK
      console.warn('Supabase connection check failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection healthy');
    return true;
  } catch (error) {
    console.error('Supabase connection check error:', error);
    return false;
  }
};

// Retry wrapper for Supabase operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Don't retry on certain errors
      if (lastError.message.includes('AbortError') || 
          lastError.message.includes('auth') ||
          lastError.message.includes('permission')) {
        throw lastError;
      }
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  
  throw lastError!;
};

// Initialize connection check on startup
if (Platform.OS !== 'web') {
  // Only run connection check on mobile to avoid web CORS issues
  setTimeout(() => {
    checkSupabaseConnection().catch(error => {
      console.warn('Initial Supabase connection check failed:', error);
    });
  }, 2000);
}

// Storage cleanup utility to prevent quota issues
export const cleanupLocalStorage = async () => {
  try {
    if (Platform.OS === 'web') {
      // For web, check localStorage usage
      const usage = JSON.stringify(localStorage).length;
      console.log('LocalStorage usage:', usage, 'bytes');
      
      // If usage is high, clear non-essential data
      if (usage > 5000000) { // 5MB threshold
        console.warn('LocalStorage usage high, clearing non-essential data');
        // Keep only essential keys
        const essentialKeys = ['supabase.auth.token', '@monument_scanner_history'];
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !essentialKeys.some(essential => key.includes(essential))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key: string) => localStorage.removeItem(key));
      }
    } else {
      // For mobile, use AsyncStorage
      // AsyncStorage is already imported at the top
      const keys = await AsyncStorage.getAllKeys();
      console.log('AsyncStorage keys:', keys.length);
      
      // Remove old or large items
      const essentialKeys = ['supabase.auth.token', '@monument_scanner_history', '@monument_scanner_history_backup'];
      const keysToCheck = keys.filter(key => !essentialKeys.some(essential => key.includes(essential)));
      
      for (const key of keysToCheck) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value && value.length > 100000) { // Remove items larger than 100KB
            console.log('Removing large storage item:', key, value.length, 'bytes');
            await AsyncStorage.removeItem(key);
          }
        } catch (error) {
          console.warn('Error checking storage item:', key, error);
        }
      }
    }
  } catch (error) {
    console.error('Error during storage cleanup:', error);
  }
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};