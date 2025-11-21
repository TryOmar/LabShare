-- Migration: Remove submission_versions and separate code/attachments
-- This migration:
-- 1. Adds submission_id to submission_files
-- 2. Populates submission_id from submission_versions
-- 3. Adds updated_at column
-- 4. Renames submission_files to submission_code
-- 5. Creates submission_attachments table
-- 6. Drops version_id and submission_versions
-- 7. Updates RLS policies

BEGIN;

-- Step 1: Add submission_id column to submission_files
ALTER TABLE submission_files 
ADD COLUMN submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;

-- Step 2: Populate submission_id from submission_versions
UPDATE submission_files sf
SET submission_id = sv.submission_id
FROM submission_versions sv
WHERE sf.version_id = sv.id;

-- Step 3: Make submission_id NOT NULL now that it's populated
ALTER TABLE submission_files 
ALTER COLUMN submission_id SET NOT NULL;

-- Step 4: Add updated_at column (set to created_at initially)
ALTER TABLE submission_files 
ADD COLUMN updated_at TIMESTAMP DEFAULT now();

UPDATE submission_files 
SET updated_at = created_at 
WHERE updated_at IS NULL;

ALTER TABLE submission_files 
ALTER COLUMN updated_at SET NOT NULL;

-- Step 5: Drop foreign key constraint on version_id
ALTER TABLE submission_files 
DROP CONSTRAINT submission_files_version_id_fkey;

-- Step 6: Drop version_id column
ALTER TABLE submission_files 
DROP COLUMN version_id;

-- Step 7: Rename submission_files to submission_code
ALTER TABLE submission_files 
RENAME TO submission_code;

-- Step 8: Make language NOT NULL (code files always have language)
-- First, set any NULL languages to 'text' as default
UPDATE submission_code 
SET language = 'text' 
WHERE language IS NULL;

ALTER TABLE submission_code 
ALTER COLUMN language SET NOT NULL;

-- Step 9: Create submission_attachments table
CREATE TABLE submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Step 10: Enable RLS on new table
ALTER TABLE submission_attachments ENABLE ROW LEVEL SECURITY;

-- Step 11: Drop RLS policies for submission_versions (will be dropped with table)
-- Note: Policies are automatically dropped when table is dropped

-- Step 12: Update RLS policies for submission_code (renamed from submission_files)
-- Drop old policies
DROP POLICY IF EXISTS "submission_files_select_all" ON submission_code;
DROP POLICY IF EXISTS "submission_files_insert_own" ON submission_code;

-- Create new policies with updated names
CREATE POLICY "submission_code_select_all" ON submission_code 
  FOR SELECT USING (true);

CREATE POLICY "submission_code_insert_own" ON submission_code 
  FOR INSERT WITH CHECK (true);

-- Step 13: Create RLS policies for submission_attachments
CREATE POLICY "submission_attachments_select_all" ON submission_attachments 
  FOR SELECT USING (true);

CREATE POLICY "submission_attachments_insert_own" ON submission_attachments 
  FOR INSERT WITH CHECK (true);

-- Step 14: Drop submission_versions table (this will also drop its policies)
DROP TABLE IF EXISTS submission_versions CASCADE;

COMMIT;

