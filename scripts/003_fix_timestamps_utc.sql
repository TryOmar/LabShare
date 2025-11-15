-- Fix timestamps to use UTC explicitly
-- Convert TIMESTAMP columns to TIMESTAMPTZ (timestamp with timezone) to ensure UTC handling
-- This migration is idempotent - safe to run multiple times

DO $$
BEGIN
  -- Check if created_at needs conversion to TIMESTAMPTZ
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'auth_codes' 
    AND column_name = 'created_at' 
    AND data_type != 'timestamp with time zone'
  ) THEN
    ALTER TABLE auth_codes 
      ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
  END IF;

  -- Check if expires_at needs conversion to TIMESTAMPTZ
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'auth_codes' 
    AND column_name = 'expires_at' 
    AND data_type != 'timestamp with time zone'
  ) THEN
    ALTER TABLE auth_codes 
      ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC';
  END IF;
END $$;

-- Set default to use UTC explicitly (safe to run multiple times)
ALTER TABLE auth_codes 
  ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'UTC');

-- Add comment to document UTC usage (safe to run multiple times)
COMMENT ON COLUMN auth_codes.created_at IS 'Timestamp in UTC';
COMMENT ON COLUMN auth_codes.expires_at IS 'Timestamp in UTC';

