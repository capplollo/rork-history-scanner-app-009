-- COMPLETE RESET: Supabase Schema for Monument Scanner App
-- ⚠️  WARNING: This will DELETE ALL existing data and tables ⚠️
-- This creates a fresh start with minimal data storage

-- =====================================================
-- 1. COMPLETE CLEANUP - DELETE ALL EXISTING DATA
-- =====================================================

-- Drop all existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_scan_history_updated_at ON public.scan_history;

-- Drop all existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_customer_id() CASCADE;

-- Drop all existing tables and their data
DROP TABLE IF EXISTS public.scan_history CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all existing policies (they will be recreated)
-- Note: Policies are automatically dropped when tables are dropped

-- =====================================================
-- 2. PROFILES TABLE (minimal user data)
-- =====================================================

-- Create simplified profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    customer_id TEXT UNIQUE NOT NULL, -- Generated customer ID
    profile_picture TEXT, -- URL to profile picture
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. SCAN HISTORY TABLE (minimal data for history cards)
-- =====================================================

-- Create simplified scan_history table (only for history cards)
CREATE TABLE public.scan_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- Monument/artwork name
    location TEXT, -- Location (city, country)
    country TEXT, -- Country
    period TEXT, -- Time period
    uploaded_picture TEXT, -- URL to uploaded picture
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for scan_history
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

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
-- 4. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate customer ID
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CUST_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the trigger execution for debugging
    RAISE LOG 'Creating profile for user: %', NEW.id;
    
    -- Insert the profile with error handling
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, customer_id)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            generate_customer_id()
        );
        
        RAISE LOG 'Profile created successfully for user: %', NEW.id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
            -- Re-raise the exception to prevent user creation if profile creation fails
            RAISE;
    END;
    
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
-- 5. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for scan_history updated_at
CREATE TRIGGER handle_scan_history_updated_at
    BEFORE UPDATE ON public.scan_history
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 6. INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_customer_id ON public.profiles(customer_id);
CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_scanned_at ON public.scan_history(scanned_at);
CREATE INDEX idx_scan_history_name ON public.scan_history(name);

-- =====================================================
-- 7. VERIFICATION QUERIES
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
    cmd
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

-- =====================================================
-- 8. EMAIL CONFIRMATION CONFIGURATION
-- =====================================================

-- Note: The following settings need to be configured in Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Enable "Enable email confirmations"
-- 3. Set "Site URL" to your app's URL (e.g., https://your-app.com)
-- 4. Add redirect URLs in "Redirect URLs" section:
--    - https://your-app.com/email-confirmation
--    - exp://localhost:8081/--/email-confirmation (for development)
-- 5. Configure email templates if needed

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

-- Success message
SELECT '✅ COMPLETE RESET SUCCESSFUL! Created tables: profiles, scan_history' as status;