-- Create instagram_accounts table
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  instagram_account_id TEXT NOT NULL,
  username TEXT NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, instagram_account_id)
);

-- Enable Row Level Security
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for instagram_accounts
CREATE POLICY "Users can view their own Instagram accounts"
  ON instagram_accounts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own Instagram accounts"
  ON instagram_accounts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own Instagram accounts"
  ON instagram_accounts
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own Instagram accounts"
  ON instagram_accounts
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX idx_instagram_accounts_instagram_id ON instagram_accounts(instagram_account_id);

-- Update scheduled_posts table to support Instagram posts
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS instagram_container_id TEXT;