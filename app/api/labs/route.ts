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

    const coursesList = (courseData || [])
      .map((ct: any) => ct.courses)
      .filter(Boolean);

    // Get labs for each course with submission status
    const labsByCourse: Record<string, any[]> = {};
    for (const course of coursesList) {
      const { data: labData, error: labError } = await supabase
        .from("labs")
        .select("*")
        .eq("course_id", course.id)
        .order("lab_number");

      if (!labError && labData) {
        // Check which labs the user has submitted
        const labIds = labData.map((lab: any) => lab.id);
        const { data: userSubmissions } = await supabase
          .from("submissions")
          .select("lab_id")
          .eq("student_id", studentId)
          .eq("is_deleted", false)
          .in("lab_id", labIds);

        const submittedLabIds = new Set(
          (userSubmissions || []).map((s: any) => s.lab_id)
        );

        // Add hasSubmission flag to each lab
        labsByCourse[course.id] = labData.map((lab: any) => ({
          ...lab,
          hasSubmission: submittedLabIds.has(lab.id),
        }));
      }
    }

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

