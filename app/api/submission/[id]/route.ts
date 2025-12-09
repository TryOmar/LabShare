import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/auth/admin";
import {
  getAttachmentDownloadUrl,
  deleteSubmissionFolder,
  deleteSubmissionFiles,
} from "@/lib/storage";
import { processAnonymousContent } from "@/lib/anonymity";

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

    // Get submission details with lab and course information
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select(
        "*, students(id, name, email), labs(id, lab_number, title, course_id, courses(id, name, description))"
      )
      .eq("id", submissionId)
      .single();

    // Process anonymous display logic
    const processedSubmission = submissionData
      ? processAnonymousContent(submissionData, studentId)
      : null;

    if (submissionError || !processedSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const isOwner = processedSubmission.student_id === studentId;

    // Check if user is an admin
    const isAdmin = await checkIsAdmin(supabase, studentId);

    // Security check: User must have submitted a solution for this lab to view any submission
    // Admins can bypass this requirement
    if (!isOwner && !isAdmin) {
      const { data: userSubmission } = await supabase
        .from("submissions")
        .select("id")
        .eq("lab_id", processedSubmission.lab_id)
        .eq("student_id", studentId)
        .single();

      if (!userSubmission) {
        return NextResponse.json(
          {
            error:
              "Access denied. You must submit a solution for this lab before viewing other submissions.",
          },
          { status: 403 }
        );
      }
    }

    // Increment view count (only for non-owners) - server-side validation
    if (!isOwner) {
      await supabase
        .from("submissions")
        .update({
          view_count: processedSubmission.view_count + 1,
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
        const urlResult = await getAttachmentDownloadUrl(
          attachment.storage_path,
          3600
        );
        return {
          ...attachment,
          downloadUrl: "url" in urlResult ? urlResult.url : null,
        };
      })
    );

    // Check if current user has upvoted this submission
    const { data: userUpvote, error: upvoteCheckError } = await supabase
      .from("submission_upvotes")
      .select("id")
      .eq("student_id", studentId)
      .eq("submission_id", submissionId)
      .single();

    const userHasUpvoted = userUpvote !== null && !upvoteCheckError;

    return NextResponse.json({
      submission: {
        ...processedSubmission,
        user_has_upvoted: userHasUpvoted,
      },
      student: studentData,
      track: studentData.tracks,
      isOwner,
      isAdmin,
      codeFiles: codeFiles || [],
      attachments: attachmentsWithUrls,
    });
  } catch (error) {
    console.error("Error in submission API:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

/**
 * PATCH /api/submission/[id]
 * Updates a submission's title and/or anonymity setting.
 * Only the owner can update their submission.
 */
export async function PATCH(
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

    const body = await request.json();
    const { isAnonymous, title } = body;

    // Validate at least one field is provided
    if (isAnonymous === undefined && title === undefined) {
      return NextResponse.json(
        { error: "At least one field (isAnonymous or title) must be provided" },
        { status: 400 }
      );
    }

    // Validate isAnonymous if provided
    if (isAnonymous !== undefined && typeof isAnonymous !== "boolean") {
      return NextResponse.json(
        { error: "isAnonymous must be a boolean" },
        { status: 400 }
      );
    }

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== "string") {
        return NextResponse.json(
          { error: "title must be a string" },
          { status: 400 }
        );
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        return NextResponse.json(
          { error: "title cannot be empty" },
          { status: 400 }
        );
      }
      if (trimmedTitle.length > 100) {
        return NextResponse.json(
          { error: "title cannot exceed 100 characters" },
          { status: 400 }
        );
      }
    }

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
        { error: "Forbidden: Cannot update other users' submissions" },
        { status: 403 }
      );
    }

    // Build update object dynamically
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (isAnonymous !== undefined) {
      updateData.is_anonymous = isAnonymous;
    }
    if (title !== undefined) {
      updateData.title = title.trim();
    }

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", submissionId)
      .select("*, students(id, name, email)")
      .single();

    if (updateError) {
      console.error("Error updating submission:", updateError);
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    // Process anonymous display logic
    const processedSubmission = updatedSubmission
      ? processAnonymousContent(updatedSubmission, studentId)
      : null;

    return NextResponse.json({
      submission: processedSubmission,
    });
  } catch (error) {
    console.error("Error in update submission API:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
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

    // Check if user is an admin
    const isAdmin = await checkIsAdmin(supabase, studentId);

    // Verify ownership or admin status
    if (submissionData.student_id !== studentId && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete other users' submissions" },
        { status: 403 }
      );
    }

    // Delete all files from storage
    const { data: attachments } = await supabase
      .from("submission_attachments")
      .select("storage_path")
      .eq("submission_id", submissionId);

    if (attachments && attachments.length > 0) {
      const filePaths = attachments.map((a) => a.storage_path);
      await deleteSubmissionFiles(filePaths);
    } else {
      // Delete folder in case of orphaned files
      await deleteSubmissionFolder(submissionId);
    }

    // Delete submission using database function (bypasses RLS)
    // This will cascade delete submission_code, submission_attachments, and comments
    // Ownership is already verified above, so this is safe
    const { error: deleteError } = await supabase.rpc("delete_submission", {
      submission_id: submissionId,
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
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
