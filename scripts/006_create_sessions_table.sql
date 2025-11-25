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
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(revoked);
CREATE INDEX IF NOT EXISTS idx_sessions_user_revoked ON sessions(user_id, revoked);

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
-- All operations are allowed server-side (authentication is handled in application code)
-- The anon key is used, but RLS allows all operations since we validate in the app layer
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

