import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/labs
 * Returns labs data for the authenticated student (courses and labs).
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

    if (studentError || !studentData) {
      console.error("Error fetching student:", studentError);
      return NextResponse.json(
        { error: "Failed to fetch student data" },
        { status: 500 }
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

    // Extract courses from nested Supabase join structure - minimal JS processing
    // Database already filtered and joined, we just extract the nested data
    const coursesList = (courseData || [])
      .map((ct: any) => ct.courses)
      .filter(Boolean);

    // Get labs for each course with submission status - PARALLELIZED & DB-LEVEL OPTIMIZED
    const courseIds = coursesList.map((course: any) => course.id);

    // Fetch all labs for all courses in parallel with a single query
    // Fetch user submissions and all submissions stats (database-level)
    const [labsResult, userSubmissionsResult, allSubmissionsResult] = await Promise.all([
      supabase
        .from("labs")
        .select("*")
        .in("course_id", courseIds)
        .order("course_id")
        .order("lab_number"),
      supabase
        .from("submissions")
        .select("lab_id")
        .eq("student_id", studentId),
      // Fetch all submissions to calculate stats per lab
      supabase
        .from("submissions")
        .select("lab_id, created_at, upvote_count, view_count")
    ]);

    const { data: allLabsData, error: allLabsError } = labsResult;
    const { data: userSubmissions } = userSubmissionsResult;
    const { data: allSubmissions } = allSubmissionsResult;

    if (allLabsError) {
      console.error("Error fetching labs:", allLabsError);
      return NextResponse.json(
        { error: "Failed to fetch labs" },
        { status: 500 }
      );
    }

    // Create a Set for O(1) lookup of submitted lab IDs (database already filtered)
    const submittedLabIds = new Set(
      (userSubmissions || []).map((s: any) => s.lab_id)
    );

    // Calculate submission stats per lab
    const labStats: Record<string, {
      submissionCount: number;
      latestSubmissionDate: string | null;
      topUpvotes: number;
      totalViews: number;
    }> = {};

    (allSubmissions || []).forEach((submission: any) => {
      const labId = submission.lab_id;
      if (!labStats[labId]) {
        labStats[labId] = {
          submissionCount: 0,
          latestSubmissionDate: null,
          topUpvotes: 0,
          totalViews: 0,
        };
      }

      labStats[labId].submissionCount++;
      labStats[labId].totalViews += submission.view_count || 0;

      // Track latest submission date
      if (!labStats[labId].latestSubmissionDate ||
        new Date(submission.created_at) > new Date(labStats[labId].latestSubmissionDate)) {
        labStats[labId].latestSubmissionDate = submission.created_at;
      }

      // Track highest upvote count
      if ((submission.upvote_count || 0) > labStats[labId].topUpvotes) {
        labStats[labId].topUpvotes = submission.upvote_count || 0;
      }
    });

    // Group labs by course - database already sorted by course_id and lab_number
    // Add hasSubmission flag and submission stats
    const labsByCourse: Record<string, any[]> = {};
    (allLabsData || []).forEach((lab: any) => {
      if (!labsByCourse[lab.course_id]) {
        labsByCourse[lab.course_id] = [];
      }
      const stats = labStats[lab.id] || {
        submissionCount: 0,
        latestSubmissionDate: null,
        topUpvotes: 0,
        totalViews: 0,
      };
      labsByCourse[lab.course_id].push({
        ...lab,
        hasSubmission: submittedLabIds.has(lab.id),
        submissionCount: stats.submissionCount,
        latestSubmissionDate: stats.latestSubmissionDate,
        topUpvotes: stats.topUpvotes,
        totalViews: stats.totalViews,
      });
    });

    return NextResponse.json({
      student: studentData,
      track: studentData.tracks,
      courses: coursesList,
      labsByCourse,
    });
  } catch (error) {
    console.error("Error in labs API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

