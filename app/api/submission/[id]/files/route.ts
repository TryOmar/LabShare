import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { uploadAttachment } from "@/lib/storage";
import { getSubmissionAnonymityStatus } from "@/lib/anonymity";

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
    const isAnonymous = await getSubmissionAnonymityStatus(supabase, submissionId);

    // Get student name only if not anonymous
    let studentName = "";
    if (!isAnonymous) {
      const { data: student } = await supabase
        .from("students")
        .select("name")
        .eq("id", studentId)
        .single();
      studentName = student?.name || "User";
    }

    let commentText = "";

    switch (options.type) {
      case 'code_update':
        // Build a list of changes in logical order: rename → language → content
        const changes: string[] = [];
        const filename = options.newFilename || options.oldFilename || 'file';
        
        if (options.filenameChanged && options.oldFilename && options.newFilename) {
          const prefix = isAnonymous ? "" : `${studentName} `;
          changes.push(`${prefix}renamed: ${options.oldFilename} → ${options.newFilename} (auto-log)`);
        }
        
        if (options.languageChanged && options.oldLanguage && options.newLanguage) {
          const prefix = isAnonymous ? "" : `${studentName} `;
          changes.push(`${prefix}changed language: ${options.oldLanguage} → ${options.newLanguage} (auto-log)`);
        }
        
        if (options.contentChanged) {
          const prefix = isAnonymous ? "" : `${studentName} `;
          changes.push(`${prefix}edited: ${filename} (auto-log)`);
        }
        
        // Join all changes with newlines
        if (changes.length > 0) {
          commentText = changes.join('\n');
        }
        break;
      case 'code_delete':
        if (options.filename) {
          const prefix = isAnonymous ? "" : `${studentName} `;
          commentText = `${prefix}deleted: ${options.filename} (auto-log)`;
        }
        break;
      case 'attachment_delete':
        if (options.filename) {
          const prefix = isAnonymous ? "" : `${studentName} `;
          commentText = `${prefix}removed: ${options.filename} (auto-log)`;
        }
        break;
      case 'attachment_rename':
        if (options.oldFilename && options.newFilename) {
          const prefix = isAnonymous ? "" : `${studentName} `;
          commentText = `${prefix}renamed: ${options.oldFilename} → ${options.newFilename} (auto-log)`;
        }
        break;
      case 'file_add':
        if (options.filename) {
          const prefix = isAnonymous ? "" : `${studentName} `;
          if (options.isCodeFile) {
            commentText = `${prefix}added: ${options.filename} (auto-log)`;
          } else {
            commentText = `${prefix}uploaded: ${options.filename} (auto-log)`;
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
 * POST /api/submission/[id]/files
 * Adds files to an existing submission.
 * Only the owner can add files to their submission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const authenticatedStudentId = authResult.studentId;
    const { id: submissionId } = await params;

    const supabase = await createClient();

    // Get submission to verify ownership
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (submission.student_id !== authenticatedStudentId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot add files to other users' submissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { files } = body;

    // Validate required fields
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "files array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Code file extensions that should be parsed and stored as text
    const codeExtensions = ['.js', '.ts', '.py', '.cpp', '.c', '.java', '.cs', '.php', '.rb', '.go', '.rs', '.txt', '.sql', '.html', '.css'];
    
    const now = new Date().toISOString();
    
    // Separate files into code files and attachments
    const codeFiles: any[] = [];
    const attachmentsToProcess: Array<{
      filename: string;
      mimeType: string;
      fileData: string; // base64 encoded or ArrayBuffer
      isBase64: boolean;
    }> = [];

    for (const file of files) {
      // Check if file has an extension
      const fileExt = file.filename ? '.' + file.filename.split('.').pop()?.toLowerCase() : '';
      
      // If file has content and language, it's a code file (pasted or uploaded code)
      // OR if it has a code extension
      if (file.content && file.language) {
        // This is a code file (pasted or uploaded code file that was parsed)
        codeFiles.push({
          submission_id: submission.id,
          filename: file.filename,
          language: file.language,
          content: file.content,
          created_at: now,
          updated_at: now,
        });
      } else if (codeExtensions.includes(fileExt)) {
        // This is a code file by extension (should have been parsed, but handle gracefully)
        codeFiles.push({
          submission_id: submission.id,
          filename: file.filename,
          language: file.language || 'text',
          content: file.content || '',
          created_at: now,
          updated_at: now,
        });
      } else {
        // This is an attachment (PDF, image, etc.)
        // Check if file has base64 data or file data
        if (file.fileData || file.base64) {
          attachmentsToProcess.push({
            filename: file.filename,
            mimeType: file.mimeType || 'application/octet-stream',
            fileData: file.fileData || file.base64,
            isBase64: !!file.base64 || file.fileData?.startsWith('data:'),
          });
        } else {
          return NextResponse.json(
            { error: `File "${file.filename}" is not a code file and no file data provided. Attachments must include file data.` },
            { status: 400 }
          );
        }
      }
    }

    // Insert code files
    if (codeFiles.length > 0) {
      const { error: codeFilesError } = await supabase
        .from("submission_code")
        .insert(codeFiles);

      if (codeFilesError) {
        console.error("Error inserting code files:", codeFilesError);
        return NextResponse.json(
          { error: "Failed to insert code files" },
          { status: 500 }
        );
      }

      // Create auto-log comments for each code file added
      for (const codeFile of codeFiles) {
        await createAutoLogComment(supabase, submission.id, authenticatedStudentId, {
          type: 'file_add',
          filename: codeFile.filename,
          isCodeFile: true,
        });
      }
    }

    // Process and upload attachments
    const attachmentsToInsert: any[] = [];
    for (const attachment of attachmentsToProcess) {
      try {
        // Convert base64 to Buffer (CRITICAL: Use Buffer directly, don't convert to ArrayBuffer)
        let fileBuffer: Buffer;
        if (attachment.isBase64) {
          // Remove data URL prefix if present (e.g., "data:image/png;base64,")
          const base64Data = attachment.fileData.includes(',') 
            ? attachment.fileData.split(',')[1] 
            : attachment.fileData;
          
          // Decode base64 directly to Buffer - this is the correct way
          fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // Assume it's already base64 encoded string (without data URL prefix)
          fileBuffer = Buffer.from(attachment.fileData, 'base64');
        }

        // Upload to storage using raw Buffer
        const uploadResult = await uploadAttachment(
          submission.id,
          attachment.filename,
          fileBuffer,
          attachment.mimeType
        );

        if ('error' in uploadResult) {
          console.error(`Error uploading attachment ${attachment.filename}:`, uploadResult.error);
          return NextResponse.json(
            { error: `Failed to upload attachment: ${uploadResult.error}` },
            { status: 500 }
          );
        }

        // Get file size from buffer (Buffer.length gives byte length)
        const fileSize = fileBuffer.length;

        // Insert attachment metadata
        attachmentsToInsert.push({
          submission_id: submission.id,
          filename: attachment.filename,
          storage_path: uploadResult.path,
          mime_type: attachment.mimeType,
          file_size: fileSize,
          created_at: now,
          updated_at: now,
        });
      } catch (error) {
        console.error(`Error processing attachment ${attachment.filename}:`, error);
        return NextResponse.json(
          { error: `Failed to process attachment: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // Insert attachments metadata
    if (attachmentsToInsert.length > 0) {
      const { error: attachmentsError } = await supabase
        .from("submission_attachments")
        .insert(attachmentsToInsert);

      if (attachmentsError) {
        console.error("Error inserting attachments:", attachmentsError);
        return NextResponse.json(
          { error: "Failed to insert attachments" },
          { status: 500 }
        );
      }

      // Create auto-log comments for each attachment added
      for (const attachment of attachmentsToInsert) {
        await createAutoLogComment(supabase, submission.id, authenticatedStudentId, {
          type: 'file_add',
          filename: attachment.filename,
          isCodeFile: false,
        });
      }
    }

    // Update submission's updated_at timestamp
    await supabase
      .from("submissions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", submission.id);

    return NextResponse.json({
      success: true,
      codeFilesAdded: codeFiles.length,
      attachmentsAdded: attachmentsToInsert.length,
    });
  } catch (error) {
    console.error("Error in add files to submission API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

