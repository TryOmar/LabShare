import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { deleteSubmissionFiles } from "@/lib/storage";

/**
 * Helper function to create auto-log comments for file operations
 */
async function createAutoLogComment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  submissionId: string,
  studentId: string,
  options: {
    type: 'code_update' | 'code_delete' | 'attachment_delete' | 'attachment_rename' | 'file_add';
    oldFilename?: string;
    newFilename?: string;
    oldLanguage?: string;
    newLanguage?: string;
    filenameChanged?: boolean;
    languageChanged?: boolean;
    contentChanged?: boolean;
    filename?: string;
    isCodeFile?: boolean;
  }
) {
  try {
    // Get submission's anonymity status - auto-log comments inherit from submission
    const { data: submission } = await supabase
      .from("submissions")
      .select("is_anonymous")
      .eq("id", submissionId)
      .single();

    const isAnonymous = submission?.is_anonymous || false;

    // Get student name
    const { data: student } = await supabase
      .from("students")
      .select("name")
      .eq("id", studentId)
      .single();

    const studentName = student?.name || "User";

    let commentText = "";

    switch (options.type) {
      case 'code_update':
        // Build a list of changes in logical order: rename → language → content
        const changes: string[] = [];
        const filename = options.newFilename || options.oldFilename || 'file';
        
        if (options.filenameChanged && options.oldFilename && options.newFilename) {
          changes.push(`${studentName} renamed: ${options.oldFilename} → ${options.newFilename} (auto-log)`);
        }
        
        if (options.languageChanged && options.oldLanguage && options.newLanguage) {
          changes.push(`${studentName} changed language: ${options.oldLanguage} → ${options.newLanguage} (auto-log)`);
        }
        
        if (options.contentChanged) {
          changes.push(`${studentName} edited: ${filename} (auto-log)`);
        }
        
        // Join all changes with newlines
        if (changes.length > 0) {
          commentText = changes.join('\n');
        }
        break;
      case 'code_delete':
        if (options.filename) {
          commentText = `${studentName} deleted: ${options.filename} (auto-log)`;
        }
        break;
      case 'attachment_delete':
        if (options.filename) {
          commentText = `${studentName} removed: ${options.filename} (auto-log)`;
        }
        break;
      case 'attachment_rename':
        if (options.oldFilename && options.newFilename) {
          commentText = `${studentName} renamed: ${options.oldFilename} → ${options.newFilename} (auto-log)`;
        }
        break;
      case 'file_add':
        if (options.filename) {
          if (options.isCodeFile) {
            commentText = `${studentName} added: ${options.filename} (auto-log)`;
          } else {
            commentText = `${studentName} uploaded: ${options.filename} (auto-log)`;
          }
        }
        break;
    }

    if (commentText) {
      await supabase
        .from("comments")
        .insert([
          {
            submission_id: submissionId,
            student_id: studentId,
            content: commentText,
            is_anonymous: isAnonymous, // Auto-log comments inherit anonymity from submission
          },
        ]);
    }
  } catch (error) {
    // Don't fail the main operation if comment creation fails
    console.error("Error creating auto-log comment:", error);
  }
}

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

