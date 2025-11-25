-- Session cleanup function
-- This function can be called periodically to clean up expired sessions
-- 
-- Usage:
--   SELECT cleanup_expired_sessions();
-- 
-- Or set up a cron job to run this periodically:
--   -- Example: Run daily at 2 AM
--   SELECT cron.schedule('cleanup-sessions', '0 2 * * *', $$SELECT cleanup_expired_sessions()$$);

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
  revoked_count INTEGER;
  total_deleted INTEGER;
  jwt_expiration_days INTEGER := 7; -- Match JWT_EXPIRES_IN default
  revoked_cleanup_days INTEGER := 1; -- Keep revoked sessions for 1 day
  expired_cutoff TIMESTAMP;
  revoked_cutoff TIMESTAMP;
BEGIN
  -- Calculate cutoff dates
  expired_cutoff := NOW() - (jwt_expiration_days || ' days')::INTERVAL;
  revoked_cutoff := NOW() - (revoked_cleanup_days || ' days')::INTERVAL;

  -- Delete expired non-revoked sessions (older than JWT expiration)
  DELETE FROM sessions
  WHERE revoked = false
    AND created_at < expired_cutoff;

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- Delete old revoked sessions
  DELETE FROM sessions
  WHERE revoked = true
    AND created_at < revoked_cutoff;

  GET DIAGNOSTICS revoked_count = ROW_COUNT;

  -- Calculate total deleted
  total_deleted := expired_count + revoked_count;

  RETURN total_deleted;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION cleanup_expired_sessions() IS 
  'Cleans up expired and stale sessions. Deletes sessions that are either revoked and older than 1 day, or not revoked but older than 7 days (JWT expiration). Returns the number of sessions deleted.';

