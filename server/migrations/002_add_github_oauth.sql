-- Migration: 002_add_github_oauth.sql
-- Add GitHub OAuth support

-- Add github_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS github_id VARCHAR(255);

-- Create index for GitHub ID lookups
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- Add unique constraint to prevent duplicate GitHub accounts (only if not exists)
-- AI: rationale — IF NOT EXISTS not supported on ALTER TABLE ADD CONSTRAINT, use DO block
DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT users_github_id_unique UNIQUE (github_id);
EXCEPTION 
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Constraint users_github_id_unique already exists, skipping';
END
$$;
