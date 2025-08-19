// Debug script to test Supabase connection and profile creation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qgpjmcpnytkewtmjfkzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGptY3BueXRrZXd0bWpma3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Mzg2MTQsImV4cCI6MjA3MTExNDYxNH0.RDznTdQFOAO6wFVaM3jWBE7yldRTASpoLut-PIzzJZk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSupabase() {
  console.log('🔍 Debugging Supabase connection and profile creation...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.log('❌ Connection error:', {
        message: error.message || 'No message',
        code: error.code || 'No code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        fullError: JSON.stringify(error, null, 2)
      });
      
      if (error.code === 'PGRST116' || error.message?.includes('relation "profiles" does not exist')) {
        console.log('⚠️  The profiles table does not exist!');
        console.log('💡 You need to run the SQL script from supabase-setup.sql in your Supabase dashboard.');
      }
    } else {
      console.log('✅ Connection successful');
      console.log('📊 Found', data.length, 'profiles');
    }
    
    // Test 2: Try to create a test profile
    console.log('\n2. Testing profile creation...');
    const testProfile = {
      id: 'test-user-id-' + Date.now(),
      email: 'test@example.com',
      full_name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile);
    
    if (insertError) {
      console.log('❌ Profile creation error:', {
        message: insertError.message || 'No message',
        code: insertError.code || 'No code',
        details: insertError.details || 'No details',
        hint: insertError.hint || 'No hint',
        fullError: JSON.stringify(insertError, null, 2)
      });
    } else {
      console.log('✅ Profile creation successful');
    }
    
    // Test 3: Check auth configuration
    console.log('\n3. Testing auth configuration...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth configuration working');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', {
      message: error.message || 'No message',
      type: typeof error,
      fullError: JSON.stringify(error, null, 2)
    });
  }
}

debugSupabase();
