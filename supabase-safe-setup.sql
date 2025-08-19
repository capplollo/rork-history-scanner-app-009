-- Safe Supabase Setup for Rork History Scanner App
-- This version handles existing objects without errors
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. PROFILES TABLE (for user authentication)
-- =====================================================

-- Create profiles table (safe - won't error if exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe - won't error if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. SCAN HISTORY TABLE (for storing monument scans)
-- =====================================================

-- Create scan_history table (safe - won't error if exists)
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    monument_name TEXT NOT NULL,
    location TEXT,
    period TEXT,
    description TEXT,
    significance TEXT,
    facts TEXT[],
    image_url TEXT,
    scanned_image_url TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence INTEGER,
    is_recognized BOOLEAN DEFAULT false,
    detailed_description JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for scan_history
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe - won't error if they don't exist)
DROP POLICY IF EXISTS "Users can view their own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can insert their own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can update their own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can delete their own scan history" ON public.scan_history;

-- Create policies for scan_history table
CREATE POLICY "Users can view their own scan history" ON public.scan_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan history" ON public.scan_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan history" ON public.scan_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan history" ON public.scan_history
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to handle new user creation (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGERS (safe - drop first)
-- =====================================================

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for scan_history updated_at
DROP TRIGGER IF EXISTS handle_scan_history_updated_at ON public.scan_history;
CREATE TRIGGER handle_scan_history_updated_at
    BEFORE UPDATE ON public.scan_history
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 5. INDEXES FOR BETTER PERFORMANCE (safe - IF NOT EXISTS)
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON public.scan_history(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_monument_name ON public.scan_history(monument_name);

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'scan_history');

-- Check if policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'scan_history');

-- Check if triggers were created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('profiles', 'scan_history', 'users');

-- Test profile creation (this will show if everything is working)
SELECT 'Setup completed successfully!' as status;
