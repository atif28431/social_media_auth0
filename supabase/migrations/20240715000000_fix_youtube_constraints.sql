-- Fix for youtube_accounts table constraint issue
-- Run this in your Supabase SQL editor

-- First, let's check if there's a unique constraint on youtube_channel_id
-- If not, we need to add one since the upsert is using onConflict: 'youtube_channel_id'

-- Add unique constraint on youtube_channel_id if it doesn't exist
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'youtube_accounts_youtube_channel_id_key' 
        AND table_name = 'youtube_accounts'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE youtube_accounts 
        ADD CONSTRAINT youtube_accounts_youtube_channel_id_key 
        UNIQUE (youtube_channel_id);
    END IF;
END $$;

-- Also ensure RLS policies are correctly set up for youtube_accounts
-- Update the policies to use the correct user ID format

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
