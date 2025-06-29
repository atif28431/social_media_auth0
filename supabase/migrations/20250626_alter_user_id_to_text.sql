-- Change user_id columns from uuid to text to support Auth0 sub values
ALTER TABLE scheduled_posts ALTER COLUMN user_id TYPE text;
ALTER TABLE facebook_pages ALTER COLUMN user_id TYPE text;
ALTER TABLE instagram_accounts ALTER COLUMN user_id TYPE text;
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE text;
