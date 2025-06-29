-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_publish_time TIMESTAMP WITH TIME ZONE NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  platform TEXT NOT NULL DEFAULT 'facebook',
  post_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create facebook_pages table
CREATE TABLE IF NOT EXISTS facebook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, page_id)
);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_pages ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid duplicate errors
DROP POLICY IF EXISTS "Users can view their own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can view their own scheduled posts"
  ON scheduled_posts
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can insert their own scheduled posts"
  ON scheduled_posts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can update their own scheduled posts"
  ON scheduled_posts
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can delete their own scheduled posts"
  ON scheduled_posts
  FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own Facebook pages" ON facebook_pages;
CREATE POLICY "Users can view their own Facebook pages"
  ON facebook_pages
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own Facebook pages" ON facebook_pages;
CREATE POLICY "Users can insert their own Facebook pages"
  ON facebook_pages
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own Facebook pages" ON facebook_pages;
CREATE POLICY "Users can update their own Facebook pages"
  ON facebook_pages
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own Facebook pages" ON facebook_pages;
CREATE POLICY "Users can delete their own Facebook pages"
  ON facebook_pages
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
DROP INDEX IF EXISTS idx_scheduled_posts_user_id;
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
DROP INDEX IF EXISTS idx_scheduled_posts_status;
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
DROP INDEX IF EXISTS idx_scheduled_posts_scheduled_time;
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_publish_time);
DROP INDEX IF EXISTS idx_facebook_pages_user_id;
CREATE INDEX idx_facebook_pages_user_id ON facebook_pages(user_id);
DROP INDEX IF EXISTS idx_facebook_pages_page_id;
CREATE INDEX idx_facebook_pages_page_id ON facebook_pages(page_id);