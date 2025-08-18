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
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);

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