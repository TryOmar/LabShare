-- Function to get suggested labs (labs with recent submissions from others that user hasn't submitted to)
-- Returns up to 3 labs ordered by most recent submission date
-- All filtering and computation done in SQL

CREATE OR REPLACE FUNCTION get_suggested_labs(
  p_student_id UUID,
  p_course_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH recent_submissions AS (
    -- Get the most recent submission per lab from labs in user's courses
    -- Excluding user's own submissions and labs user has already submitted to
    SELECT DISTINCT ON (l.id)
      l.id as lab_id,
      l.lab_number,
      l.title as lab_title,
      l.course_id,
      c.name as course_name,
      s.created_at as latest_submission_date
    FROM submissions s
    INNER JOIN labs l ON s.lab_id = l.id
    INNER JOIN courses c ON l.course_id = c.id
    WHERE l.course_id = ANY(p_course_ids)
      AND s.student_id != p_student_id
      -- Exclude labs the user has already submitted to
      AND NOT EXISTS (
        SELECT 1 
        FROM submissions us 
        WHERE us.lab_id = l.id 
        AND us.student_id = p_student_id
      )
    ORDER BY l.id, s.created_at DESC
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'lab_id', lab_id,
        'lab_number', lab_number,
        'lab_title', lab_title,
        'course_id', course_id,
        'course_name', course_name,
        'latest_submission_date', latest_submission_date
      )
      ORDER BY latest_submission_date DESC
    ),
    '[]'::jsonb
  )
  INTO result
  FROM (
    SELECT * FROM recent_submissions
    ORDER BY latest_submission_date DESC
    LIMIT 3
  ) top_labs;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

