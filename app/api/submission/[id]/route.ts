import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/submission/[id]
 * Returns submission data including versions and files.
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
    const { id: submissionId } = await params;

    const supabase = await createClient();

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

    // Get submission details
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select("*, students(id, name, email)")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submissionData) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const isOwner = submissionData.student_id === studentId;

    // Security check: User must have submitted a solution for this lab to view any submission
    if (!isOwner) {
      const { data: userSubmission } = await supabase
        .from("submissions")
        .select("id")
        .eq("lab_id", submissionData.lab_id)
        .eq("student_id", studentId)
        .eq("is_deleted", false)
        .single();

      if (!userSubmission) {
        return NextResponse.json(
          { error: "Access denied. You must submit a solution for this lab before viewing other submissions." },
          { status: 403 }
        );
      }
    }

    // Increment view count (only for non-owners) - server-side validation
    if (!isOwner) {
      await supabase
        .from("submissions")
        .update({
          view_count: submissionData.view_count + 1,
        })
        .eq("id", submissionId);
    }

    // Get all versions for this submission
    const { data: versionData, error: versionError } = await supabase
      .from("submission_versions")
      .select("*")
      .eq("submission_id", submissionId)
      .eq("is_deleted", false)
      .order("version_number", { ascending: false });

    if (versionError) {
      console.error("Error fetching versions:", versionError);
      return NextResponse.json(
        { error: "Failed to fetch versions" },
        { status: 500 }
      );
    }

    // Get files for the latest version (or first version if available)
    let filesData: any[] = [];
    if (versionData && versionData.length > 0) {
      const { data: files, error: filesError } = await supabase
        .from("submission_files")
        .select("*")
        .eq("version_id", versionData[0].id);

      if (!filesError && files) {
        filesData = files;
      }
    }

    return NextResponse.json({
      submission: submissionData,
      student: studentData,
      track: studentData.tracks,
      isOwner,
      versions: versionData || [],
      files: filesData,
    });
  } catch (error) {
    console.error("Error in submission API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submission/[id]
 * Deletes a submission (soft delete - sets is_deleted to true).
 * Only the owner can delete their submission.
 */
export async function DELETE(
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
    const { id: submissionId } = await params;

    const supabase = await createClient();

    // Get submission to verify ownership
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select("student_id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submissionData) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (submissionData.student_id !== studentId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete other users' submissions" },
        { status: 403 }
      );
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from("submissions")
      .update({ is_deleted: true })
      .eq("id", submissionId);

    if (deleteError) {
      console.error("Error deleting submission:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete submission API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

