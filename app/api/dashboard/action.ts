"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedStudentId } from "@/lib/auth";

export async function getDashboardAction() {
  try {
    // Validate authentication
    const studentId = await getAuthenticatedStudentId();
    if (!studentId) {
      return { error: "Unauthorized", status: 401 };
    }

    const supabase = await createClient();

    // Get student info first (needed for track_id)
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*, tracks(id, code, name)")
      .eq("id", studentId)
      .single();

    if (studentError) {
      console.error("Error fetching student:", studentError);
      return {
        error: "Failed to fetch student data",
        status: 500
      };
    }

    if (!studentData) {
      return { error: "Student not found", status: 404 };
    }

    // After we have the student's track, fetch courses and run database RPCs in parallel.
    // The submissions RPC uses a conservative default `limitEstimate` so we don't
    // have to wait for the course list to compute it (keeps requests parallel).
    const limitEstimate = 100; // safe default: 10 per course * avg courses + buffer

    const [courseResp, submissionResult, suggestedLabsResult] = await Promise.all([
      supabase
        .from("course_track")
        .select("courses(id, name, description)")
        .eq("track_id", studentData.track_id),
      supabase.rpc("get_dashboard_submissions", {
        p_student_id: studentId,
        p_limit: limitEstimate,
      }),
      supabase.rpc("get_suggested_labs", {
        p_student_id: studentId,
      }),
    ]);

    const { data: courseData, error: courseError } = courseResp as any;

    if (courseError) {
      console.error("Error fetching courses:", courseError);
      return {
        error: "Failed to fetch courses",
        status: 500
      };
    }

    // Extract courses from nested Supabase join structure - minimal JS processing
    const coursesList = (courseData || []).map((ct: any) => ct.courses).filter(Boolean);

    if (coursesList.length === 0) {
      // No courses, return early
      return {
        student: studentData,
        track: studentData.tracks,
        courses: [],
        coursesWithSubmissions: [],
        recentSubmissions: [],
        suggestedLabs: [],
      };
    }

    const { data: submissionData, error: submissionError } = submissionResult;
    const { data: suggestedLabs, error: suggestedLabsError } = suggestedLabsResult;

    if (submissionError) {
      console.error("Error fetching submissions:", submissionError);
      return {
        error: "Failed to fetch submissions",
        status: 500
      };
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

    return {
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
    };
  } catch (error) {
    console.error("Error in dashboard action:", error);
    return { error: "An error occurred", status: 500 };
  }
}
