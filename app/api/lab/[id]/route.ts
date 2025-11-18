import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/lab/[id]
 * Returns lab data for a specific lab, including submissions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;
    const { id: labId } = await params;

    const supabase = await createClient();

    // Get lab details
    const { data: labData, error: labError } = await supabase
      .from("labs")
      .select("*")
      .eq("id", labId)
      .single();

    if (labError || !labData) {
      return NextResponse.json(
        { error: "Lab not found" },
        { status: 404 }
      );
    }

    // Get student info
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

    // Get user's submission
    const { data: userSubmissionData } = await supabase
      .from("submissions")
      .select("*")
      .eq("lab_id", labId)
      .eq("student_id", studentId)
      .single();

    // Check if this is an upload request (allows access for uploading)
    const { searchParams } = new URL(request.url);
    const isUploadRequest = searchParams.get("upload") === "true";

    // Security check: User must have submitted this lab to access it (unless it's an upload request)
    if (!userSubmissionData && !isUploadRequest) {
      return NextResponse.json(
        { error: "Access denied. You must submit a solution for this lab before accessing it." },
        { status: 403 }
      );
    }

    // Check if user has unlocked this lab
    const { data: labUnlock } = await supabase
      .from("lab_unlocks")
      .select("*")
      .eq("lab_id", labId)
      .eq("student_id", studentId)
      .single();

    // Get submissions (all if unlocked or has submitted, else only own)
    let submissionsQuery = supabase
      .from("submissions")
      .select("*, students(id, name, email)")
      .eq("lab_id", labId);

    // If not unlocked and hasn't submitted, show only own (unless it's an upload request)
    if (!labUnlock && !userSubmissionData && !isUploadRequest) {
      submissionsQuery = submissionsQuery.eq("student_id", studentId);
    }

    // For upload requests, don't show any submissions until user has submitted
    if (isUploadRequest && !userSubmissionData) {
      submissionsQuery = submissionsQuery.eq("student_id", studentId).limit(0);
    }

    const { data: submissionData, error: submissionError } = await submissionsQuery;

    if (submissionError) {
      console.error("Error fetching submissions:", submissionError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lab: labData,
      student: studentData,
      track: studentData.tracks,
      userSubmission: userSubmissionData || null,
      submissions: submissionData || [],
    });
  } catch (error) {
    console.error("Error in lab API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

