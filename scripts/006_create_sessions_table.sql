-- Create sessions table for JWT-based authentication
-- This table stores server-side session information bound to device fingerprints

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  last_seen TIMESTAMP DEFAULT now(),
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for efficient session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
-- Note: idx_sessions_id is not needed - PRIMARY KEY automatically creates an index
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(revoked);
CREATE INDEX IF NOT EXISTS idx_sessions_user_revoked ON sessions(user_id, revoked);

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
-- 
-- SECURITY NOTE: These policies allow all operations (USING (true) and WITH CHECK (true)),
-- which effectively disables Row Level Security for this table. This is intentional because:
-- 
-- 1. The application uses the anon key and validates authentication at the application layer
-- 2. All session operations are performed server-side via API routes that require authentication
-- 3. The application code enforces that users can only access their own sessions
-- 
-- RISK: If the anon key is compromised or if there's a bug in application-level validation,
-- users could potentially access other users' sessions. Consider implementing proper RLS
-- policies that restrict operations to the authenticated user if security requirements change.
-- 
-- For production deployments with higher security requirements, consider:
-- - Using service role key for server-side operations (with proper access controls)
-- - Implementing RLS policies that check user_id against auth.uid() or session context
-- - Adding additional application-level checks and audit logging
--
CREATE POLICY "sessions_select_all" ON sessions FOR SELECT 
  USING (true);

-- Server-side session creation (via API routes)
CREATE POLICY "sessions_insert" ON sessions FOR INSERT 
  WITH CHECK (true);

-- Server-side session updates (revoke, update last_seen)
CREATE POLICY "sessions_update" ON sessions FOR UPDATE 
  USING (true);

-- Server-side session deletion
CREATE POLICY "sessions_delete" ON sessions FOR DELETE 
  USING (true);

