-- Fix Supabase Schema Issues
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CREATE CHAT_SESSIONS TABLE (if it doesn't exist)
-- =====================================================

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB DEFAULT '[]'::jsonb,
    monument_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions table
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can insert their own chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can delete their own chat sessions" ON public.chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chat_sessions updated_at
DROP TRIGGER IF EXISTS handle_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER handle_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_updated ON public.chat_sessions(last_updated);

-- =====================================================
-- 2. CHECK SCAN_HISTORY TABLE STRUCTURE
-- =====================================================

-- Check current scan_history table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'scan_history'
ORDER BY ordinal_position;

-- If the scan_history table has the wrong columns, uncomment and run the following:
-- This will recreate the table with the correct simplified structure

/*
-- Backup existing data first
CREATE TABLE IF NOT EXISTS scan_history_backup AS SELECT * FROM public.scan_history;

-- Drop and recreate with correct structure
DROP TABLE IF EXISTS public.scan_history CASCADE;

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

-- Create policies for scan_history table
CREATE POLICY "Users can view their own scan history" ON public.scan_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan history" ON public.scan_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan history" ON public.scan_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan history" ON public.scan_history
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for scan_history updated_at
CREATE OR REPLACE FUNCTION public.handle_scan_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_scan_history_updated_at ON public.scan_history;
CREATE TRIGGER handle_scan_history_updated_at
    BEFORE UPDATE ON public.scan_history
    FOR EACH ROW EXECUTE FUNCTION public.handle_scan_history_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON public.scan_history(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_name ON public.scan_history(name);
CREATE INDEX IF NOT EXISTS idx_scan_history_country ON public.scan_history(country);
*/

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Check if chat_sessions table exists and has correct structure
SELECT 
    'chat_sessions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_sessions'
ORDER BY ordinal_position;

-- Check if policies exist
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('chat_sessions', 'scan_history');

SELECT 'Schema fix completed successfully!' as status;