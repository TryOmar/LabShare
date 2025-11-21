import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { deleteSubmissionFiles } from "@/lib/storage";
import { createAutoLogComment } from "@/lib/auto-log";

/**
 * PATCH /api/submission/[id]/attachment/[attachmentId]
 * Updates an attachment (filename only).
 * Only the owner can update their submission files.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;
    const { id: submissionId, attachmentId } = await params;

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

    // Get attachment to verify it belongs to this submission and get current filename
    const { data: attachmentData, error: attachmentError } = await supabase
      .from("submission_attachments")
      .select("submission_id, filename")
      .eq("id", attachmentId)
      .single();

    if (attachmentError || !attachmentData) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    if (attachmentData.submission_id !== submissionId) {
      return NextResponse.json(
        { error: "Attachment does not belong to this submission" },
        { status: 400 }
      );
    }

    const oldFilename = attachmentData.filename;

    // Get update data from request body
    const body = await request.json();
    const { filename } = body;

    if (filename === undefined) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    if (!filename || filename.trim().length === 0) {
      return NextResponse.json(
        { error: "Filename cannot be empty" },
        { status: 400 }
      );
    }

    // Update attachment
    const { error: updateError } = await supabase
      .from("submission_attachments")
      .update({
        filename: filename.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attachmentId);

    if (updateError) {
      console.error("Error updating attachment:", updateError);
      return NextResponse.json(
        { error: "Failed to update attachment" },
        { status: 500 }
      );
    }

    // Try to get the updated attachment data
    // If RLS blocks this, we'll still return success since the update succeeded
    const { data: updatedAttachment } = await supabase
      .from("submission_attachments")
      .select()
      .eq("id", attachmentId)
      .eq("submission_id", submissionId)
      .maybeSingle();

    // Update submission's updated_at timestamp
    await supabase
      .from("submissions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", submissionId);

    const finalAttachment = updatedAttachment || { 
      id: attachmentId, 
      submission_id: submissionId, 
      filename: filename.trim() 
    };

    // Create auto-log comment if filename changed
    if (oldFilename !== finalAttachment.filename) {
      await createAutoLogComment(supabase, submissionId, studentId, {
        type: 'attachment_rename',
        oldFilename,
        newFilename: finalAttachment.filename,
      });
    }

    return NextResponse.json({ 
      success: true, 
      attachment: finalAttachment 
    });
  } catch (error) {
    console.error("Error in update attachment API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submission/[id]/attachment/[attachmentId]
 * Deletes an attachment.
 * Only the owner can delete their submission files.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;
    const { id: submissionId, attachmentId } = await params;

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

    // Get attachment to verify it belongs to this submission and get storage path and filename
    const { data: attachmentData, error: attachmentError } = await supabase
      .from("submission_attachments")
      .select("submission_id, storage_path, filename")
      .eq("id", attachmentId)
      .single();

    if (attachmentError || !attachmentData) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    if (attachmentData.submission_id !== submissionId) {
      return NextResponse.json(
        { error: "Attachment does not belong to this submission" },
        { status: 400 }
      );
    }

    const filename = attachmentData.filename;

    // Delete file from storage (same approach as submission delete)
    if (attachmentData.storage_path) {
      const deleteResult = await deleteSubmissionFiles([attachmentData.storage_path]);
      if ('error' in deleteResult) {
        console.error("Error deleting file from storage:", deleteResult.error);
        // Continue with database deletion even if storage deletion fails
        // (file might already be deleted or not exist)
      }
    }

    // Delete attachment record
    const { error: deleteError } = await supabase
      .from("submission_attachments")
      .delete()
      .eq("id", attachmentId);

    if (deleteError) {
      console.error("Error deleting attachment:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete attachment" },
        { status: 500 }
      );
    }

    // Update submission's updated_at timestamp
    await supabase
      .from("submissions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", submissionId);

    // Create auto-log comment
    await createAutoLogComment(supabase, submissionId, studentId, {
      type: 'attachment_delete',
      filename,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete attachment API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

