// Simple test script to debug Supabase connection
// Run this with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qgpjmcpnytkewtmjfkzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGptY3BueXRrZXd0bWpma3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Mzg2MTQsImV4cCI6MjA3MTExNDYxNH0.RDznTdQFOAO6wFVaM3jWBE7yldRTASpoLut-PIzzJZk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    // Test 1: Check if profiles table exists
    console.log('1. Checking if profiles table exists...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.log('❌ Error accessing profiles table:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      
      if (error.code === 'PGRST116' || error.message?.includes('relation "profiles" does not exist')) {
        console.log('\n⚠️  SOLUTION: The profiles table does not exist!');
        console.log('   You need to run the SQL script from supabase-complete-setup.sql');
        console.log('   in your Supabase dashboard SQL editor.');
      }
    } else {
      console.log('✅ Profiles table exists and is accessible');
      console.log('   Found', data.length, 'profiles');
    }
    
    // Test 2: Try to create a test profile
    console.log('\n2. Testing profile creation...');
    const testProfile = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      full_name: 'Test User'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Profile creation failed:');
      console.log('   Message:', insertError.message);
      console.log('   Code:', insertError.code);
      console.log('   Details:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Profile creation successful!');
      console.log('   Created profile:', insertData);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testConnection();
