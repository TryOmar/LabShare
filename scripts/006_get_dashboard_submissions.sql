-- Function to get dashboard submissions with hasAccess and anonymous handling computed in SQL
-- This function computes everything in a single SQL query:
-- 1. Joins submissions with students, labs, and courses
-- 2. Calculates hasAccess (owner OR user has submitted to lab)
-- 3. Handles anonymous display (hides student info if anonymous and not owner)
-- 4. Returns upvote_count from submissions table (or 0 if NULL)

CREATE OR REPLACE FUNCTION get_dashboard_submissions(
  p_student_id UUID,
  p_limit INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Return submissions grouped by course_id, ordered by course's most recent activity
  WITH ranked_submissions AS (
    SELECT 
      s.*,
      l.course_id,
      ROW_NUMBER() OVER (PARTITION BY l.course_id ORDER BY s.created_at DESC) as rn,
      MAX(s.created_at) OVER (PARTITION BY l.course_id) as course_max_date
    FROM submissions s
    INNER JOIN labs l ON s.lab_id = l.id
        WHERE l.course_id IN (
      SELECT ct.course_id FROM course_track ct
      WHERE ct.track_id = (
        SELECT track_id FROM students WHERE id = p_student_id
      )
    )
  ),
  submission_data AS (
    SELECT 
      ranked.*,
      st.id as student_table_id,
      st.name as student_name,
      st.email as student_email,
      l.id as lab_table_id,
      l.lab_number,
      l.title as lab_title,
      c.id as course_table_id,
      c.name as course_name
    FROM ranked_submissions ranked
    INNER JOIN students st ON ranked.student_id = st.id
    INNER JOIN labs l ON ranked.lab_id = l.id
    INNER JOIN courses c ON l.course_id = c.id
    WHERE ranked.rn <= 10
  ),
  grouped_by_course AS (
    SELECT 
      course_id,
      course_max_date,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'student_id', student_id,
          'lab_id', lab_id,
          'title', title,
          'view_count', view_count,
          'upvote_count', COALESCE(upvote_count, 0),
          'created_at', created_at,
          'updated_at', updated_at,
          'is_anonymous', COALESCE(is_anonymous, false),
          'hasAccess', (student_id = p_student_id OR EXISTS (
            SELECT 1 
            FROM submissions us 
            WHERE us.lab_id = submission_data.lab_id 
            AND us.student_id = p_student_id
          )),
          'students', CASE 
            WHEN COALESCE(is_anonymous, false) AND student_id != p_student_id THEN
              jsonb_build_object(
                'id', '',
                'name', 'Anonymous',
                'email', CASE WHEN student_email IS NOT NULL THEN '' ELSE NULL END
              )
            ELSE
              jsonb_build_object(
                'id', student_table_id,
                'name', student_name,
                'email', student_email
              )
          END,
          'labs', jsonb_build_object(
            'id', lab_table_id,
            'lab_number', lab_number,
            'title', lab_title,
            'course_id', course_id,
            'courses', jsonb_build_object(
              'id', course_table_id,
              'name', course_name
            )
          )
        ) ORDER BY created_at DESC
      ) as submissions
    FROM submission_data
    GROUP BY course_id, course_max_date
  )
  SELECT COALESCE(
    jsonb_object_agg(
      course_id::text,
      submissions
    ),
    '{}'::jsonb
  )
  INTO result
  FROM (
    SELECT course_id, submissions
    FROM grouped_by_course
    ORDER BY course_max_date DESC
  ) ordered_courses;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

