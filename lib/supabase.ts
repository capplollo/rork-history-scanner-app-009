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
    console.log('Starting storage cleanup...');
    
    if (Platform.OS === 'web') {
      // For web, just log usage without aggressive cleanup
      try {
        const usage = JSON.stringify(localStorage).length;
        console.log('LocalStorage usage:', usage, 'bytes');
        
        // Only cleanup if usage is extremely high
        if (usage > 8000000) { // 8MB threshold
          console.warn('LocalStorage usage very high, performing minimal cleanup');
          // Only remove non-essential temporary keys
          const tempKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('temp_') || key.includes('cache_'))) {
              tempKeys.push(key);
            }
          }
          tempKeys.forEach((key: string) => {
            try {
              localStorage.removeItem(key);
            } catch {
              console.warn('Failed to remove temp key:', key);
            }
          });
        }
      } catch (webError) {
        console.warn('Web storage cleanup failed:', webError);
      }
    } else {
      // For mobile, minimal cleanup
      try {
        const keys = await AsyncStorage.getAllKeys();
        console.log('AsyncStorage keys count:', keys.length);
        
        // Only remove obviously temporary keys
        const tempKeys = keys.filter(key => 
          key.includes('temp_') || 
          key.includes('cache_') ||
          key.includes('_old')
        );
        
        if (tempKeys.length > 0) {
          console.log('Removing temporary keys:', tempKeys.length);
          await AsyncStorage.multiRemove(tempKeys);
        }
      } catch (mobileError) {
        console.warn('Mobile storage cleanup failed:', mobileError);
      }
    }
    
    console.log('Storage cleanup completed successfully');
  } catch (error) {
    console.error('Storage cleanup failed:', error);
    // Don't throw - let the app continue
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