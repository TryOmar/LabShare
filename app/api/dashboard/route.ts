import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/dashboard
 * Returns dashboard data for the authenticated student.
 * This replaces client-side queries with server-side validation.
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;

    const supabase = await createClient();

    // Get student info first (needed for track_id)
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*, tracks(id, code, name)")
      .eq("id", studentId)
      .single();

    if (studentError) {
      console.error("Error fetching student:", studentError);
      return NextResponse.json(
        { error: "Failed to fetch student data" },
        { status: 500 }
      );
    }

    if (!studentData) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get courses for this track - database does the join
    const { data: courseData, error: courseError } = await supabase
      .from("course_track")
      .select("courses(id, name, description)")
      .eq("track_id", studentData.track_id);

    if (courseError) {
      console.error("Error fetching courses:", courseError);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    // Extract courses from nested Supabase join structure - minimal JS processing
    // Database already filtered and joined, we just extract the nested data
    const coursesList = (courseData || [])
      .map((ct: any) => ct.courses)
      .filter(Boolean);

    if (coursesList.length === 0) {
      // No courses, return early
      return NextResponse.json({
        student: studentData,
        track: studentData.tracks,
        courses: [],
        coursesWithSubmissions: [],
        recentSubmissions: [],
        suggestedLabs: [],
      });
    }

    // Extract course IDs - needed for SQL filtering (minimal JS - single map operation)
    const courseIds = coursesList.map((c: any) => c.id);

    // Single SQL query that does all computation in the database
    // Database calculates limit: 10 per course * number of courses + buffer
    const limitEstimate = Math.max(100, courseIds.length * 15);

    // Execute SQL queries in parallel - all computation done in database
    const [submissionResult, suggestedLabsResult] = await Promise.all([
      // Execute single SQL query that computes hasAccess and handles anonymous display
      supabase.rpc('get_dashboard_submissions', {
        p_student_id: studentId,
        p_course_ids: courseIds,
        p_limit: limitEstimate
      }),
      // Execute single SQL query that gets suggested labs
      supabase.rpc('get_suggested_labs', {
        p_student_id: studentId,
        p_course_ids: courseIds
      })
    ]);

    const { data: submissionData, error: submissionError } = submissionResult;
    const { data: suggestedLabs, error: suggestedLabsError } = suggestedLabsResult;

    if (submissionError) {
      console.error("Error fetching submissions:", submissionError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    // Note: suggestedLabs error is non-critical - if it fails, user just won't see suggestions

    // All computation done in SQL - submissions already grouped by course_id and sorted
    // SQL returns: { "course_id": [submissions...], ... } ordered by course's most recent activity
    const submissionsByCourse: Record<string, any[]> = submissionData || {};
    
    // Get course order from SQL result keys (already sorted by course_max_date DESC)
    const courseOrder = Object.keys(submissionsByCourse);
    
    // Calculate most recent date per course and prepare courses with submissions
    const coursesWithSubmissions = coursesList
      .map((course: any) => {
        const courseSubmissions = submissionsByCourse[course.id] || [];
        const mostRecentDate =
          courseSubmissions.length > 0
            ? new Date(courseSubmissions[0].created_at).getTime()
            : 0;
        return {
          ...course,
          submissions: courseSubmissions,
          mostRecentDate,
          _order: courseOrder.indexOf(course.id),
        };
      })
      .sort((a: any, b: any) => {
        // Sort by SQL order (courses with submissions first, then by their order)
        if (a._order === -1 && b._order === -1) return 0;
        if (a._order === -1) return 1;
        if (b._order === -1) return -1;
        return a._order - b._order;
      })
      .map(({ _order, ...course }: any) => course);
    
    // Flatten submissions for recent submissions list
    const processedSubmissions = Object.values(submissionsByCourse).flat();

    return NextResponse.json({
      student: studentData,
      track: studentData.tracks,
      courses: coursesWithSubmissions.map(
        ({ submissions, mostRecentDate, ...course }: any) => course
      ),
      coursesWithSubmissions: coursesWithSubmissions.map(
        ({ mostRecentDate, ...course }: any) => course
      ),
      recentSubmissions: processedSubmissions,
      suggestedLabs: suggestedLabs || [],
    });
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
