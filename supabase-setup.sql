-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS scan_history;

-- Create scan_history table for storing user scan history
CREATE TABLE scan_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  period TEXT NOT NULL,
  image TEXT NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history(scanned_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own scan history" ON scan_history;
DROP POLICY IF EXISTS "Users can insert their own scan history" ON scan_history;
DROP POLICY IF EXISTS "Users can update their own scan history" ON scan_history;
DROP POLICY IF EXISTS "Users can delete their own scan history" ON scan_history;

-- Create policy to allow users to only see their own scan history
CREATE POLICY "Users can view their own scan history" ON scan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan history" ON scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan history" ON scan_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan history" ON scan_history
  FOR DELETE USING (auth.uid() = user_id);