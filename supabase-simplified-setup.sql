-- Simplified Supabase Setup for Monuments and Art Scanner
-- This will clean up the scan_history table to only store essential fields
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. BACKUP EXISTING DATA (OPTIONAL)
-- =====================================================

-- Create a backup table first (uncomment if you want to keep existing data)
-- CREATE TABLE scan_history_backup AS SELECT * FROM public.scan_history;

-- =====================================================
-- 2. DROP AND RECREATE SCAN_HISTORY TABLE
-- =====================================================

-- Drop the existing table (this will delete all data)
DROP TABLE IF EXISTS public.scan_history CASCADE;

-- Create simplified scan_history table with only essential fields
CREATE TABLE public.scan_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    country TEXT,
    period TEXT,
    image TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE POLICIES
-- =====================================================

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
-- 4. CREATE TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scan_history updated_at
DROP TRIGGER IF EXISTS handle_scan_history_updated_at ON public.scan_history;
CREATE TRIGGER handle_scan_history_updated_at
    BEFORE UPDATE ON public.scan_history
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON public.scan_history(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_name ON public.scan_history(name);
CREATE INDEX IF NOT EXISTS idx_scan_history_country ON public.scan_history(country);

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'scan_history'
ORDER BY ordinal_position;

-- Check if policies were created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'scan_history';

SELECT 'Simplified setup completed successfully!' as status;