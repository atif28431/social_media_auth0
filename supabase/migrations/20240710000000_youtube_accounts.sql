-- Create youtube_accounts table
CREATE TABLE IF NOT EXISTS youtube_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  youtube_channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_description TEXT,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, youtube_channel_id)
);

-- Enable Row Level Security
ALTER TABLE youtube_accounts ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid duplicate errors
DROP POLICY IF EXISTS "Users can view their own YouTube accounts" ON youtube_accounts;
CREATE POLICY "Users can view their own YouTube accounts"
  ON youtube_accounts
  FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'::text));

DROP POLICY IF EXISTS "Users can insert their own YouTube accounts" ON youtube_accounts;
CREATE POLICY "Users can insert their own YouTube accounts"
  ON youtube_accounts
  FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'::text));

DROP POLICY IF EXISTS "Users can update their own YouTube accounts" ON youtube_accounts;
CREATE POLICY "Users can update their own YouTube accounts"
  ON youtube_accounts
  FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'::text));

DROP POLICY IF EXISTS "Users can delete their own YouTube accounts" ON youtube_accounts;
CREATE POLICY "Users can delete their own YouTube accounts"
  ON youtube_accounts
  FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub'::text));

-- Create indexes
CREATE INDEX idx_youtube_accounts_user_id ON youtube_accounts(user_id);
CREATE INDEX idx_youtube_accounts_channel_id ON youtube_accounts(youtube_channel_id);

-- Update user_sessions table to support YouTube tokens
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS youtube_access_token TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS youtube_refresh_token TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS youtube_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Update scheduled_posts table to support YouTube posts
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS video_title TEXT;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS video_description TEXT;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS video_tags TEXT[];
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS video_category_id TEXT;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS video_privacy_status TEXT DEFAULT 'public';