-- Create user_sessions table to store session information
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  auth_provider TEXT NOT NULL DEFAULT 'auth0',
  access_token TEXT,
  refresh_token TEXT,
  facebook_access_token TEXT,
  instagram_access_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid duplicate errors
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
CREATE POLICY "Users can insert their own sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
CREATE POLICY "Users can update their own sessions"
  ON user_sessions
  FOR UPDATE
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;
CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Create indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);