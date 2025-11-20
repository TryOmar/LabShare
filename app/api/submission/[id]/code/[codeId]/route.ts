import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

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
 * PATCH /api/submission/[id]/code/[codeId]
 * Updates a code file (content, filename, or language).
 * Only the owner can update their submission files.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;
    const { id: submissionId, codeId } = await params;

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

    // Get code file to verify it belongs to this submission and get current values
    const { data: codeFileData, error: codeFileError } = await supabase
      .from("submission_code")
      .select("submission_id, filename, language, content")
      .eq("id", codeId)
      .single();

    if (codeFileError || !codeFileData) {
      return NextResponse.json(
        { error: "Code file not found" },
        { status: 404 }
      );
    }

    if (codeFileData.submission_id !== submissionId) {
      return NextResponse.json(
        { error: "Code file does not belong to this submission" },
        { status: 400 }
      );
    }

    // Store old values for auto-comment
    const oldFilename = codeFileData.filename;
    const oldLanguage = codeFileData.language;
    const oldContent = codeFileData.content;

    // Get update data from request body
    const body = await request.json();
    const { filename, content, language } = body;

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (filename !== undefined) {
      if (!filename || filename.trim().length === 0) {
        return NextResponse.json(
          { error: "Filename cannot be empty" },
          { status: 400 }
        );
      }
      updates.filename = filename.trim();
    }

    if (content !== undefined) {
      updates.content = content;
    }

    if (language !== undefined) {
      if (!language || language.trim().length === 0) {
        return NextResponse.json(
          { error: "Language cannot be empty" },
          { status: 400 }
        );
      }
      updates.language = language.trim();
    }

    // Update code file
    // Use update with select to verify the update actually happened
    const { data: updateData, error: updateError } = await supabase
      .from("submission_code")
      .update(updates)
      .eq("id", codeId)
      .eq("submission_id", submissionId) // Add submission_id check for RLS
      .select();

    if (updateError) {
      console.error("Error updating code file:", updateError);
      return NextResponse.json(
        { error: "Failed to update code file" },
        { status: 500 }
      );
    }

    // Check if update actually affected any rows
    if (!updateData || updateData.length === 0) {
      // Update didn't affect any rows - might be RLS or file doesn't exist
      // Try to verify the file exists first
      const { data: verifyData } = await supabase
        .from("submission_code")
        .select("id")
        .eq("id", codeId)
        .eq("submission_id", submissionId)
        .maybeSingle();

      if (!verifyData) {
        return NextResponse.json(
          { error: "Code file not found" },
          { status: 404 }
        );
      }

      // File exists but update didn't work - likely RLS issue
      // Try update without select to see if that works
      const { error: updateOnlyError } = await supabase
        .from("submission_code")
        .update(updates)
        .eq("id", codeId)
        .eq("submission_id", submissionId);

      if (updateOnlyError) {
        console.error("Error updating code file (update only):", updateOnlyError);
        return NextResponse.json(
          { error: "Failed to update code file" },
          { status: 500 }
        );
      }

      // Verify the update actually happened by checking the file after a brief delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const { data: verifyUpdate, error: verifyError } = await supabase
        .from("submission_code")
        .select("id, filename, language, content, updated_at")
        .eq("id", codeId)
        .eq("submission_id", submissionId)
        .maybeSingle();

      // Check if filename actually changed (or if we're updating something else)
      const expectedFilename = updates.filename;
      if (expectedFilename && verifyUpdate && verifyUpdate.filename !== expectedFilename) {
        console.error("Update verification failed: filename mismatch", {
          expected: expectedFilename,
          actual: verifyUpdate.filename,
          codeId,
          submissionId
        });
        return NextResponse.json(
          { error: "Update verification failed - file was not updated" },
          { status: 500 }
        );
      }

      // Update succeeded - update submission timestamp
      await supabase
        .from("submissions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", submissionId);

      const finalFile = verifyUpdate || { id: codeId, submission_id: submissionId, ...updates };

      // Create auto-log comment
      await createAutoLogComment(supabase, submissionId, studentId, {
        type: 'code_update',
        oldFilename,
        newFilename: finalFile.filename || oldFilename,
        oldLanguage,
        newLanguage: finalFile.language || oldLanguage,
        filenameChanged: filename !== undefined && oldFilename !== finalFile.filename,
        languageChanged: language !== undefined && oldLanguage !== finalFile.language,
        contentChanged: content !== undefined,
      });

      // Return the verified data or the updates we made
      return NextResponse.json({ 
        success: true, 
        file: finalFile 
      });
    }

    // Update succeeded and we got the data back
    // Update submission's updated_at timestamp
    await supabase
      .from("submissions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", submissionId);

    // Create auto-log comment
    const updatedFile = updateData[0];
    await createAutoLogComment(supabase, submissionId, studentId, {
      type: 'code_update',
      oldFilename,
      newFilename: updatedFile.filename,
      oldLanguage,
      newLanguage: updatedFile.language,
      filenameChanged: filename !== undefined && oldFilename !== updatedFile.filename,
      languageChanged: language !== undefined && oldLanguage !== updatedFile.language,
      contentChanged: content !== undefined && oldContent !== updatedFile.content,
    });

    return NextResponse.json({ 
      success: true, 
      file: updateData[0] 
    });
  } catch (error) {
    console.error("Error in update code file API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submission/[id]/code/[codeId]
 * Deletes a code file.
 * Only the owner can delete their submission files.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;
    const { id: submissionId, codeId } = await params;

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

    // Get code file to verify it belongs to this submission and get filename for auto-log
    const { data: codeFileData, error: codeFileError } = await supabase
      .from("submission_code")
      .select("submission_id, filename")
      .eq("id", codeId)
      .single();

    if (codeFileError || !codeFileData) {
      return NextResponse.json(
        { error: "Code file not found" },
        { status: 404 }
      );
    }

    if (codeFileData.submission_id !== submissionId) {
      return NextResponse.json(
        { error: "Code file does not belong to this submission" },
        { status: 400 }
      );
    }

    const filename = codeFileData.filename;

    // Delete code file
    const { error: deleteError } = await supabase
      .from("submission_code")
      .delete()
      .eq("id", codeId);

    if (deleteError) {
      console.error("Error deleting code file:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete code file" },
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
      type: 'code_delete',
      filename,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete code file API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

