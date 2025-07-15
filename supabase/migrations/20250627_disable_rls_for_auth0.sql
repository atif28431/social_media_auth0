-- Disable Row Level Security for Auth0 integration
-- Since we're using Auth0 for authentication instead of Supabase auth,
-- auth.uid() will always be null, making RLS policies ineffective.
-- We'll handle authorization in the application layer.

-- Disable RLS on all tables
ALTER TABLE scheduled_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies since they won't work with Auth0
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

-- Note: Authorization will be handled in the application layer
-- by filtering queries based on the Auth0 user ID stored in user_id columns