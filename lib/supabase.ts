import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      scan_history: {
        Row: {
          id: string;
          user_id: string;
          monument_name: string;
          location: string;
          period: string;
          image_url: string;
          description: string;
          confidence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monument_name: string;
          location: string;
          period: string;
          image_url: string;
          description: string;
          confidence: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monument_name?: string;
          location?: string;
          period?: string;
          image_url?: string;
          description?: string;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type ScanHistoryItem = Database['public']['Tables']['scan_history']['Row'];