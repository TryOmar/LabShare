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

    // Run all queries in parallel - all filtering done in SQL
    // Get courses and user submissions first (needed to determine course IDs)
    const [courseResult, userSubmissionsResult] = await Promise.all([
      // Get courses for this track - database does the join
      supabase
        .from("course_track")
        .select("courses(id, name, description)")
        .eq("track_id", studentData.track_id),
      // Get all labs the user has submitted to (for access checking) - database filtering
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
    
    // Create Set for O(1) lookup of solved lab IDs - database already filtered by student_id
    const solvedLabIds = new Set(
      (userSubmissions || []).map((s: any) => s.lab_id)
    );

    // Get lab IDs filtered by course_id in SQL - all filtering in database
    const { data: labsData, error: labsError } = await supabase
      .from("labs")
      .select("id")
      .in("course_id", courseIds);
    
    if (labsError) {
      console.error("Error fetching labs:", labsError);
      // Continue without lab filtering - will fetch all submissions
    }
    
    // Extract lab IDs from SQL result - minimal JS processing (single map)
    const labIds = (labsData || []).map((lab: any) => lab.id);
    
    // Fetch submissions with all filtering done in SQL
    // Database calculates limit: 10 per course * number of courses + buffer
    const limitEstimate = Math.max(100, courseIds.length * 15);
    
    // Build submissions query with all filtering in SQL
    let submissionQuery = supabase
      .from("submissions")
      .select(`
        *,
        students(id, name, email),
        labs!inner(id, lab_number, title, course_id, courses(id, name))
      `)
      .order("created_at", { ascending: false })
      .limit(limitEstimate);
    
    // Filter by lab_id at database level (all in SQL)
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

    // Group submissions by course_id - database already sorted by created_at DESC
    // Use a Map for O(1) course lookup and track counts for efficient limiting
    const submissionsByCourse: Record<string, any[]> = {};
    const courseSubmissionCounts: Record<string, number> = {};
    
    // Process submissions - database already sorted, so we get most recent first
    // Limit to 10 per course efficiently during grouping (database-level sorted)
    processedSubmissions.forEach((submission: any) => {
      const courseId = submission.labs?.course_id;
      if (courseId) {
        // Initialize course array if needed
        if (!submissionsByCourse[courseId]) {
          submissionsByCourse[courseId] = [];
          courseSubmissionCounts[courseId] = 0;
        }
        
        // Only add if we haven't reached the limit (database already sorted)
        if (courseSubmissionCounts[courseId] < 10) {
          submissionsByCourse[courseId].push(submission);
          courseSubmissionCounts[courseId]++;
        }
      }
    });

    // Calculate most recent date per course and prepare courses with submissions
    // Database already sorted submissions, so first item per course is most recent
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

    // Sort courses by most recent activity (descending) - efficient sort on pre-calculated dates
    coursesWithSubmissions.sort((a: any, b: any) => b.mostRecentDate - a.mostRecentDate);

    // Get suggested labs (labs with recent submissions from others that user hasn't submitted to)
    // Database already sorted submissions by created_at DESC, so we process most recent first
    // Use Sets for O(1) lookup performance
    const courseIdsInTrack = new Set(coursesList.map((c: any) => c.id));
    const suggestedLabs: any[] = [];
    const seenLabIds = new Set<string>();
    
    // Process submissions in database-sorted order (most recent first)
    // Efficiently build suggestions with O(1) lookups using Sets
    for (const submission of processedSubmissions) {
      // Early exit if we have enough suggestions
      if (suggestedLabs.length >= 3) break;
      
      const labId = submission.lab_id;
      const courseId = submission.labs?.course_id;
      
      // Fast filtering using Set lookups (database already filtered by lab_id)
      if (!courseId || !courseIdsInTrack.has(courseId)) continue;
      if (solvedLabIds.has(labId)) continue;
      if (seenLabIds.has(labId)) continue;
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

