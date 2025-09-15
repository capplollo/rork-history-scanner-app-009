-- Create scan_history table for storing user scan history
CREATE TABLE IF NOT EXISTS scan_history (
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

-- Create policy to allow users to only see their own scan history
CREATE POLICY "Users can view their own scan history" ON scan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan history" ON scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan history" ON scan_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan history" ON scan_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scan_history_updated_at
  BEFORE UPDATE ON scan_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to create the table if it doesn't exist (for the RPC call)
CREATE OR REPLACE FUNCTION create_scan_history_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- This function is mainly for the app to call, but the table should already exist
  -- Just return success
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;