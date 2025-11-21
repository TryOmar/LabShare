-- Add performance indexes for commonly queried columns
-- This migration improves query performance for dashboard and other frequently used queries

-- Indexes for submissions table
-- Index on created_at for ordering submissions (most common query)
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- Index on student_id for filtering user submissions
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);

-- Index on lab_id for filtering submissions by lab
CREATE INDEX IF NOT EXISTS idx_submissions_lab_id ON submissions(lab_id);

-- Composite index for student_id + lab_id (used in unique constraint, but helps queries too)
CREATE INDEX IF NOT EXISTS idx_submissions_student_lab ON submissions(student_id, lab_id);

-- Indexes for labs table
-- Index on course_id for filtering labs by course
CREATE INDEX IF NOT EXISTS idx_labs_course_id ON labs(course_id);

-- Index on course_id + lab_number (used in unique constraint, but helps queries too)
CREATE INDEX IF NOT EXISTS idx_labs_course_lab_number ON labs(course_id, lab_number);

-- Indexes for course_track table
-- Index on track_id for filtering courses by track (very common query)
CREATE INDEX IF NOT EXISTS idx_course_track_track_id ON course_track(track_id);

-- Index on course_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_course_track_course_id ON course_track(course_id);

-- Indexes for students table
-- Index on track_id for filtering students by track
CREATE INDEX IF NOT EXISTS idx_students_track_id ON students(track_id);

-- Indexes for auth_codes table (for OTP verification)
-- Composite index for code + student_id + used + created_at
CREATE INDEX IF NOT EXISTS idx_auth_codes_lookup ON auth_codes(code, student_id, used, created_at DESC);

-- Indexes for comments table
-- Index on submission_id for filtering comments by submission
CREATE INDEX IF NOT EXISTS idx_comments_submission_id ON comments(submission_id);

-- Index on student_id for filtering comments by student
CREATE INDEX IF NOT EXISTS idx_comments_student_id ON comments(student_id);

-- Indexes for lab_unlocks table
-- Composite index for student_id + lab_id
CREATE INDEX IF NOT EXISTS idx_lab_unlocks_student_lab ON lab_unlocks(student_id, lab_id);

