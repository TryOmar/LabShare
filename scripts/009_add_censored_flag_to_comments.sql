-- Migration: Add is_censored flag to comments table
-- This flag indicates if a comment had bad words and was censored

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS is_censored BOOLEAN DEFAULT FALSE;

-- Add index for filtering censored comments if needed
CREATE INDEX IF NOT EXISTS idx_comments_is_censored ON comments(is_censored) WHERE is_censored = TRUE;

