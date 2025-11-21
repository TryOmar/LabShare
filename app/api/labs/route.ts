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
    // Fetch user submissions separately to check submission status (database-level)
    const [labsResult, submissionsResult] = await Promise.all([
      supabase
        .from("labs")
        .select("*")
        .in("course_id", courseIds)
        .order("course_id")
        .order("lab_number"),
      supabase
        .from("submissions")
        .select("lab_id")
        .eq("student_id", studentId)
    ]);

    const { data: allLabsData, error: allLabsError } = labsResult;
    const { data: userSubmissions } = submissionsResult;

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

    // Group labs by course - database already sorted by course_id and lab_number
    // Minimal JS processing: just grouping and adding hasSubmission flag
    const labsByCourse: Record<string, any[]> = {};
    (allLabsData || []).forEach((lab: any) => {
      if (!labsByCourse[lab.course_id]) {
        labsByCourse[lab.course_id] = [];
      }
      labsByCourse[lab.course_id].push({
        ...lab,
        hasSubmission: submittedLabIds.has(lab.id),
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

