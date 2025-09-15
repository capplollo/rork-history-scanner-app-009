import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qgpjmcpnytkewtmjfkzw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGptY3BueXRrZXd0bWpma3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Mzg2MTQsImV4cCI6MjA3MTExNDYxNH0.RDznTdQFOAO6wFVaM3jWBE7yldRTASpoLut-PIzzJZk';

console.log('Supabase configuration:', {
  url: supabaseUrl ? 'present' : 'missing',
  key: supabaseAnonKey ? 'present' : 'missing',
  urlValue: supabaseUrl?.substring(0, 30) + '...',
  keyValue: supabaseAnonKey?.substring(0, 30) + '...'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});