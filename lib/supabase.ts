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
    detectSessionInUrl: Platform.OS === 'web',
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);

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
          customer_id: string;
          profile_picture: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          customer_id: string;
          profile_picture?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          customer_id?: string;
          profile_picture?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scan_history: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          location: string | null;
          country: string | null;
          period: string | null;
          uploaded_picture: string | null;
          scanned_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          location?: string | null;
          country?: string | null;
          period?: string | null;
          uploaded_picture?: string | null;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          location?: string | null;
          country?: string | null;
          period?: string | null;
          uploaded_picture?: string | null;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};