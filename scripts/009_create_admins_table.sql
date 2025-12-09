-- Migration script for admins table (if it doesn't exist)
-- The admins table stores email addresses for admin privilege checking

-- Note: This table may already exist with just (id, email) columns
-- If it exists, this script will not modify it

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS (idempotent)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy for admins table - allow authenticated users to read
-- (The actual admin check is done in application code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admins' AND policyname = 'admins_select_authenticated'
  ) THEN
    CREATE POLICY admins_select_authenticated ON admins FOR SELECT USING (true);
  END IF;
END
$$;

-- Create index for email lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(lower(email));
