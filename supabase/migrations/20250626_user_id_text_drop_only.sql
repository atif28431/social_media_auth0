-- Drop all RLS policies referencing user_id so we can alter the column type
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

-- Now you can safely alter the user_id columns to text in a separate migration.
