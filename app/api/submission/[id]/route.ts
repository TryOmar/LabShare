import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getAttachmentDownloadUrl } from "@/lib/storage";

/**
 * GET /api/submission/[id]
 * Returns submission data including code files and attachments.
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

    // Get code files for this submission
    const { data: codeFiles, error: codeFilesError } = await supabase
      .from("submission_code")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });

    if (codeFilesError) {
      console.error("Error fetching code files:", codeFilesError);
      return NextResponse.json(
        { error: "Failed to fetch code files" },
        { status: 500 }
      );
    }

    // Get attachments for this submission
    const { data: attachments, error: attachmentsError } = await supabase
      .from("submission_attachments")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });

    if (attachmentsError) {
      console.error("Error fetching attachments:", attachmentsError);
      return NextResponse.json(
        { error: "Failed to fetch attachments" },
        { status: 500 }
      );
    }

    // Generate signed URLs for attachments (valid for 1 hour)
    const attachmentsWithUrls = await Promise.all(
      (attachments || []).map(async (attachment) => {
        const urlResult = await getAttachmentDownloadUrl(attachment.storage_path, 3600);
        return {
          ...attachment,
          downloadUrl: 'url' in urlResult ? urlResult.url : null,
        };
      })
    );

    return NextResponse.json({
      submission: submissionData,
      student: studentData,
      track: studentData.tracks,
      isOwner,
      codeFiles: codeFiles || [],
      attachments: attachmentsWithUrls,
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
 * Deletes a submission permanently.
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

    // Delete submission using database function (bypasses RLS)
    // Ownership is already verified above, so this is safe
    const { error: deleteError } = await supabase.rpc('delete_submission', {
      submission_id: submissionId
    });

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

