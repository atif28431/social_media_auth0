-- Drop all RLS policies referencing user_id
DROP POLICY IF EXISTS "Users can view their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can insert their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can update their own scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can delete their own scheduled posts" ON scheduled_posts;

DROP POLICY IF EXISTS "Users can view their own Facebook pages" ON facebook_pages;
DROP POLICY IF EXISTS "Users can insert their own Facebook pages" ON facebook_pages;
DROP POLICY IF EXISTS "Users can update their own Facebook pages" ON facebook_pages;
DROP POLICY IF EXISTS "Users can delete their own Facebook pages" ON facebook_pages;

DROP POLICY IF EXISTS "Users can view their own Instagram accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can insert their own Instagram accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can update their own Instagram accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can delete their own Instagram accounts" ON instagram_accounts;

DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;

-- Change user_id columns to text
ALTER TABLE scheduled_posts ALTER COLUMN user_id TYPE text;
ALTER TABLE facebook_pages ALTER COLUMN user_id TYPE text;
ALTER TABLE instagram_accounts ALTER COLUMN user_id TYPE text;
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE text;

-- Recreate policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts"
  ON scheduled_posts
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own scheduled posts"
  ON scheduled_posts
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own scheduled posts"
  ON scheduled_posts
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own scheduled posts"
  ON scheduled_posts
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Recreate policies for facebook_pages
CREATE POLICY "Users can view their own Facebook pages"
  ON facebook_pages
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own Facebook pages"
  ON facebook_pages
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own Facebook pages"
  ON facebook_pages
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own Facebook pages"
  ON facebook_pages
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Recreate policies for instagram_accounts
CREATE POLICY "Users can view their own Instagram accounts"
  ON instagram_accounts
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own Instagram accounts"
  ON instagram_accounts
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own Instagram accounts"
  ON instagram_accounts
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own Instagram accounts"
  ON instagram_accounts
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Recreate policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own sessions"
  ON user_sessions
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  USING (user_id = auth.uid()::text);
