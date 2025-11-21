import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { processAnonymousContentArray } from "@/lib/anonymity";

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
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Run multiple queries in parallel for better performance
    const [courseResult, userSubmissionsResult] = await Promise.all([
      // Get courses for this track
      supabase
        .from("course_track")
        .select("courses(id, name, description)")
        .eq("track_id", studentData.track_id),
      // Get all labs the user has submitted to (for access checking)
      supabase
        .from("submissions")
        .select("lab_id")
        .eq("student_id", studentId)
    ]);

    const { data: courseData, error: courseError } = courseResult;
    const { data: userSubmissions } = userSubmissionsResult;
    
    // Note: userSubmissions error is non-critical - if it fails, user just won't have access to locked labs

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

    const courseIds = coursesList.map((c: any) => c.id);
    const solvedLabIds = new Set(
      (userSubmissions || []).map((s: any) => s.lab_id)
    );

    // Get labs for these courses, then filter submissions by lab_id (more efficient)
    const { data: labsData, error: labsError } = await supabase
      .from("labs")
      .select("id, course_id")
      .in("course_id", courseIds);

    if (labsError) {
      console.error("Error fetching labs:", labsError);
      // Continue without lab filtering - will fetch all submissions
    }

    const labIds = (labsData || []).map((lab: any) => lab.id);
    
    // Fetch submissions filtered by lab_id in SQL for better performance
    // Calculate limit: 10 per course * number of courses + buffer for sorting
    const limitEstimate = Math.max(100, courseIds.length * 15);
    
    let submissionQuery = supabase
      .from("submissions")
      .select(`
        *,
        students(id, name, email),
        labs(id, lab_number, title, course_id, courses(id, name))
      `)
      .order("created_at", { ascending: false })
      .limit(limitEstimate);

    // Filter by lab_id if we have labs (more efficient than filtering in JS)
    if (labIds.length > 0) {
      submissionQuery = submissionQuery.in("lab_id", labIds);
    }
    
    const { data: submissionData, error: submissionError } = await submissionQuery;

    if (submissionError) {
      console.error("Error fetching submissions:", submissionError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    // Add hasAccess flag to each submission and handle anonymous display
    const submissionsWithAccess = (submissionData || []).map((submission: any) => {
      const isOwner = submission.student_id === studentId;
      const hasAccess = isOwner || solvedLabIds.has(submission.lab_id);
      
      return {
        ...submission,
        hasAccess,
      };
    });

    // Process anonymous display logic
    const processedSubmissions = processAnonymousContentArray(submissionsWithAccess, studentId);

    // Group submissions by course_id
    const submissionsByCourse: Record<string, any[]> = {};
    processedSubmissions.forEach((submission: any) => {
      const courseId = submission.labs?.course_id;
      if (courseId) {
        if (!submissionsByCourse[courseId]) {
          submissionsByCourse[courseId] = [];
        }
        submissionsByCourse[courseId].push(submission);
      }
    });

    // Limit submissions per course to 10 most recent
    Object.keys(submissionsByCourse).forEach((courseId) => {
      submissionsByCourse[courseId] = submissionsByCourse[courseId].slice(0, 10);
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

    // Get suggested labs (labs with recent submissions from others that user hasn't submitted to)
    // Only include labs from courses in the user's track
    const courseIdsInTrack = new Set(coursesList.map((c: any) => c.id));
    const suggestedLabs: any[] = [];
    const seenLabIds = new Set<string>();
    
    // Get unique labs from recent submissions that user hasn't submitted to
    for (const submission of processedSubmissions) {
      const labId = submission.lab_id;
      const courseId = submission.labs?.course_id;
      
      // Skip if course is not in user's track
      if (!courseId || !courseIdsInTrack.has(courseId)) continue;
      
      // Skip if user already submitted to this lab
      if (solvedLabIds.has(labId)) continue;
      
      // Skip if we've already added this lab
      if (seenLabIds.has(labId)) continue;
      
      // Skip if submission is from the user themselves
      if (submission.student_id === studentId) continue;
      
      if (labId && courseId && submission.labs) {
        seenLabIds.add(labId);
        suggestedLabs.push({
          lab_id: labId,
          lab_number: submission.labs.lab_number,
          lab_title: submission.labs.title,
          course_id: courseId,
          course_name: submission.labs.courses?.name,
          latest_submission_date: submission.created_at,
        });
        
        // Stop at 3 suggestions
        if (suggestedLabs.length >= 3) break;
      }
    }

    return NextResponse.json({
      student: studentData,
      track: studentData.tracks,
      courses: coursesWithSubmissions.map(({ submissions, mostRecentDate, ...course }: any) => course),
      coursesWithSubmissions: coursesWithSubmissions.map(({ mostRecentDate, ...course }: any) => course),
      recentSubmissions: processedSubmissions,
      suggestedLabs: suggestedLabs.slice(0, 3),
    });
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

