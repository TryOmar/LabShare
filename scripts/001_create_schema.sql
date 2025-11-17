-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- "BWD", "OS", "WEB"
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  track_id UUID NOT NULL REFERENCES tracks(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create course_track join table (many-to-many)
CREATE TABLE IF NOT EXISTS course_track (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  UNIQUE(course_id, track_id)
);

-- Create labs table
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lab_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(course_id, lab_number)
);

-- Create auth_codes table
CREATE TABLE IF NOT EXISTS auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  used BOOLEAN DEFAULT FALSE
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, lab_id)
);

-- Create submission_code table (for code files - pasted or uploaded code)
CREATE TABLE IF NOT EXISTS submission_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create submission_attachments table (for non-code files - PDFs, images, etc.)
CREATE TABLE IF NOT EXISTS submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create lab_unlocks table
CREATE TABLE IF NOT EXISTS lab_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, lab_id)
);

-- Enable RLS on all tables
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_track ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_unlocks ENABLE ROW LEVEL SECURITY;

-- Policies for students (all can read, students edit own)
CREATE POLICY "students_select_all" ON students FOR SELECT USING (true);
CREATE POLICY "students_update_own" ON students FOR UPDATE USING (true);

-- Policies for tracks (public read)
CREATE POLICY "tracks_select_all" ON tracks FOR SELECT USING (true);

-- Policies for courses (public read)
CREATE POLICY "courses_select_all" ON courses FOR SELECT USING (true);

-- Policies for course_track (public read)
CREATE POLICY "course_track_select_all" ON course_track FOR SELECT USING (true);

-- Policies for labs (public read)
CREATE POLICY "labs_select_all" ON labs FOR SELECT USING (true);

-- Policies for auth_codes (insert only)
CREATE POLICY "auth_codes_insert" ON auth_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_codes_select" ON auth_codes FOR SELECT USING (true);

-- Policies for submissions (anyone can read, only owner can edit/delete)
CREATE POLICY "submissions_select_all" ON submissions FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "submissions_insert_own" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update_own" ON submissions FOR UPDATE USING (true);
CREATE POLICY "submissions_delete_own" ON submissions FOR DELETE USING (true);

-- Policies for submission_code (anyone can read)
CREATE POLICY "submission_code_select_all" ON submission_code FOR SELECT USING (true);
CREATE POLICY "submission_code_insert_own" ON submission_code FOR INSERT WITH CHECK (true);

-- Policies for submission_attachments (anyone can read)
CREATE POLICY "submission_attachments_select_all" ON submission_attachments FOR SELECT USING (true);
CREATE POLICY "submission_attachments_insert_own" ON submission_attachments FOR INSERT WITH CHECK (true);

-- Policies for comments (anyone can read and write)
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "comments_insert_any" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_update_own" ON comments FOR UPDATE USING (true);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (true);

-- Policies for lab_unlocks (anyone can read and write)
CREATE POLICY "lab_unlocks_select_all" ON lab_unlocks FOR SELECT USING (true);
CREATE POLICY "lab_unlocks_insert_own" ON lab_unlocks FOR INSERT WITH CHECK (true);
