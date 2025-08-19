-- Verification script for Supabase setup
-- Run this to check if everything is working correctly

-- Check if profiles table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if scan_history table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'scan_history'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'scan_history');

-- Check if policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'scan_history');

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('profiles', 'scan_history', 'users');

-- Test if we can query the profiles table (should work for authenticated users)
SELECT 'Profiles table is accessible' as test_result
FROM public.profiles 
LIMIT 1;

-- Test if we can query the scan_history table (should work for authenticated users)
SELECT 'Scan history table is accessible' as test_result
FROM public.scan_history 
LIMIT 1;
