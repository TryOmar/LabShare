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

    // Get student info with track
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
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get courses for this track
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

    const coursesList = (courseData || [])
      .map((ct: any) => ct.courses)
      .filter(Boolean);

    // Get recent submissions with lab and course information (get more to have enough per course)
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select(`
        *,
        students(id, name, email),
        labs(id, lab_number, title, course_id, courses(id, name))
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (submissionError) {
      console.error("Error fetching submissions:", submissionError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    // Get all labs the user has submitted to
    const { data: userSubmissions } = await supabase
      .from("submissions")
      .select("lab_id")
      .eq("student_id", studentId);

    const solvedLabIds = new Set(
      (userSubmissions || []).map((s: any) => s.lab_id)
    );

    // Add hasAccess flag to each submission
    const submissionsWithAccess = (submissionData || []).map((submission: any) => ({
      ...submission,
      hasAccess: submission.student_id === studentId || solvedLabIds.has(submission.lab_id),
    }));

    // Group submissions by course_id
    const submissionsByCourse: Record<string, any[]> = {};
    submissionsWithAccess.forEach((submission: any) => {
      const courseId = submission.labs?.course_id;
      if (courseId) {
        if (!submissionsByCourse[courseId]) {
          submissionsByCourse[courseId] = [];
        }
        submissionsByCourse[courseId].push(submission);
      }
    });

    // Limit submissions per course to 3 most recent
    Object.keys(submissionsByCourse).forEach((courseId) => {
      submissionsByCourse[courseId] = submissionsByCourse[courseId].slice(0, 3);
    });

    // Sort courses by most recent activity (most recent submission date)
    const coursesWithSubmissions = coursesList.map((course: any) => {
      const courseSubmissions = submissionsByCourse[course.id] || [];
      const mostRecentDate = courseSubmissions.length > 0
        ? new Date(courseSubmissions[0].created_at).getTime()
        : 0;
      return {
        ...course,
        submissions: courseSubmissions,
        mostRecentDate,
      };
    });

    // Sort by most recent activity (descending)
    coursesWithSubmissions.sort((a: any, b: any) => b.mostRecentDate - a.mostRecentDate);

    return NextResponse.json({
      student: studentData,
      track: studentData.tracks,
      courses: coursesWithSubmissions.map(({ submissions, mostRecentDate, ...course }: any) => course),
      coursesWithSubmissions: coursesWithSubmissions.map(({ mostRecentDate, ...course }: any) => course),
      recentSubmissions: submissionsWithAccess,
    });
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

