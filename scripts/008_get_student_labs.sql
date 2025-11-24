-- Function to get all labs data for a student
-- Returns student info, track, courses, and labs grouped by course with submission status

CREATE OR REPLACE FUNCTION get_student_labs(
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_track_id UUID;
  v_student_data JSONB;
  v_track_data JSONB;
  v_courses JSONB;
  v_labs_by_course JSONB;
BEGIN
  -- Get student and track ID
  -- We construct the nested structure to match the API response format
  SELECT 
    to_jsonb(s.*) || jsonb_build_object('tracks', to_jsonb(t.*))
  INTO 
    v_student_data
  FROM students s
  JOIN tracks t ON t.id = s.track_id
  WHERE s.id = p_student_id;

  IF v_student_data IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Student or track not found',
      'status', 404
    );
  END IF;

  -- Extract track data separately for the top-level 'track' return field
  v_track_data := v_student_data -> 'tracks';
  v_track_id := (v_track_data ->> 'id')::uuid;

  -- Get courses for the track
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description
    )
  )
  INTO v_courses
  FROM course_track ct
  JOIN courses c ON c.id = ct.course_id
  WHERE ct.track_id = v_track_id;

  -- Get labs with submission status, grouped by course
  -- Use CTEs for readability and performance
  WITH user_submissions AS (
    SELECT DISTINCT lab_id 
    FROM submissions 
    WHERE student_id = p_student_id
  ),
  course_labs AS (
    SELECT 
      l.*,
      EXISTS(SELECT 1 FROM user_submissions us WHERE us.lab_id = l.id) as "hasSubmission"
    FROM labs l
    JOIN course_track ct ON l.course_id = ct.course_id
    WHERE ct.track_id = v_track_id
  )
  SELECT jsonb_object_agg(
    course_id::text,
    labs_array
  )
  INTO v_labs_by_course
  FROM (
    SELECT 
      course_id, 
      jsonb_agg(to_jsonb(cl.*) ORDER BY lab_number) as labs_array
    FROM course_labs cl
    GROUP BY course_id
  ) grouped;

  RETURN jsonb_build_object(
    'student', v_student_data,
    'track', v_track_data,
    'courses', COALESCE(v_courses, '[]'::jsonb),
    'labsByCourse', COALESCE(v_labs_by_course, '{}'::jsonb)
  );
END;
$$;

