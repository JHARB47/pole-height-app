-- Migration: 002_add_github_oauth.sql
-- Add GitHub OAuth support

-- Add github_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS github_id VARCHAR(255);

-- Create index for GitHub ID lookups
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- Add unique constraint to prevent duplicate GitHub accounts
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS users_github_id_unique UNIQUE (github_id);
