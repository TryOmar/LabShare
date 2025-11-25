-- Migration: Remove soft deletes and convert to hard deletes
-- This migration:
-- 1. Removes revoked column from sessions table (convert to hard deletes)
-- 2. Drops indexes related to revoked column
-- 3. Updates cleanup function to only delete expired sessions (not revoked ones)
-- 4. Creates cleanup function for expired/used auth_codes

BEGIN;

-- Step 1: Drop indexes that reference revoked column
DROP INDEX IF EXISTS idx_sessions_revoked;
DROP INDEX IF EXISTS idx_sessions_user_revoked;

-- Step 2: Remove revoked column from sessions table
ALTER TABLE sessions DROP COLUMN IF EXISTS revoked;

-- Step 3: Update cleanup_expired_sessions function to only delete expired sessions
-- (no longer need to handle revoked sessions separately)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
  jwt_expiration_days INTEGER := 7; -- Match JWT_EXPIRES_IN default
  expired_cutoff TIMESTAMP;
BEGIN
  -- Calculate cutoff date
  expired_cutoff := NOW() - (jwt_expiration_days || ' days')::INTERVAL;

  -- Delete expired sessions (older than JWT expiration)
  DELETE FROM sessions
  WHERE created_at < expired_cutoff;

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$;

-- Add comment explaining the updated function
COMMENT ON FUNCTION cleanup_expired_sessions() IS 
  'Cleans up expired sessions. Deletes sessions older than 7 days (JWT expiration). Returns the number of sessions deleted.';

-- Step 4: Create cleanup function for expired/used auth_codes
CREATE OR REPLACE FUNCTION cleanup_expired_auth_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  cleanup_hours INTEGER := 24; -- Delete codes older than 24 hours
  cutoff_timestamp TIMESTAMPTZ;
BEGIN
  -- Calculate cutoff timestamp (24 hours ago)
  cutoff_timestamp := NOW() - (cleanup_hours || ' hours')::INTERVAL;

  -- Delete expired or used codes older than cutoff
  DELETE FROM auth_codes
  WHERE expires_at < cutoff_timestamp
     OR (used = true AND created_at < cutoff_timestamp);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION cleanup_expired_auth_codes() IS 
  'Cleans up expired and used auth codes. Deletes codes that are either expired or used and older than 24 hours. Returns the number of codes deleted.';

COMMIT;

