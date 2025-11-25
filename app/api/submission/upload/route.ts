import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { uploadAttachment } from "@/lib/storage";

/**
 * POST /api/submission/upload
 * Creates or updates a submission with files.
 * Uses the authenticated studentId from JWT session (validated server-side).
 * This prevents users from submitting on behalf of other users.
 *
 * Files are separated into:
 * - Code files: Saved to submission_code table (pasted or uploaded code files)
 * - Attachments: Saved to submission_attachments table (PDFs, images, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const authenticatedStudentId = authResult.studentId;

    const body = await request.json();
    const { labId, title, files, isAnonymous } = body;

    // Validate required fields
    if (
      !labId ||
      !title ||
      !files ||
      !Array.isArray(files) ||
      files.length === 0
    ) {
      return NextResponse.json(
        { error: "labId, title, and files are required" },
        { status: 400 }
      );
    }

    // Check for duplicate filenames (case-insensitive)
    const filenameMap = new Map<string, string>();
    const duplicates: string[] = [];

    for (const file of files) {
      if (!file.filename) {
        return NextResponse.json(
          { error: "All files must have a filename" },
          { status: 400 }
        );
      }

      const filenameLower = file.filename.toLowerCase();
      if (filenameMap.has(filenameLower)) {
        duplicates.push(file.filename);
      } else {
        filenameMap.set(filenameLower, file.filename);
      }
    }

    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          error: `Duplicate filenames detected: ${duplicates.join(
            ", "
          )}. Each file must have a unique name.`,
        },
        { status: 400 }
      );
    }

    // Note: We use authenticatedStudentId from the JWT session, not from the request body
    // This prevents users from submitting on behalf of other users

    const supabase = await createClient();

    // Get or create submission
    let { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("*")
      .eq("lab_id", labId)
      .eq("student_id", authenticatedStudentId)
      .single();

    if (submissionError && submissionError.code !== "PGRST116") {
      // PGRST116 is "not found" - that's okay, we'll create it
      console.error("Error fetching submission:", submissionError);
      return NextResponse.json(
        { error: "Failed to fetch submission" },
        { status: 500 }
      );
    }

    if (!submission) {
      // Create new submission
      const { data: newSubmission, error: createError } = await supabase
        .from("submissions")
        .insert([
          {
            lab_id: labId,
            student_id: authenticatedStudentId,
            title,
            is_anonymous: isAnonymous === true,
          },
        ])
        .select()
        .single();

      if (createError || !newSubmission) {
        console.error("Error creating submission:", createError);
        return NextResponse.json(
          { error: "Failed to create submission" },
          { status: 500 }
        );
      }

      submission = newSubmission;
    } else {
      // Update existing submission
      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          title,
          is_anonymous: isAnonymous === true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (updateError) {
        console.error("Error updating submission:", updateError);
        return NextResponse.json(
          { error: "Failed to update submission" },
          { status: 500 }
        );
      }
    }

    // Code file extensions that should be parsed and stored as text
    const codeExtensions = [
      ".js",
      ".ts",
      ".py",
      ".cpp",
      ".c",
      ".java",
      ".cs",
      ".php",
      ".rb",
      ".go",
      ".rs",
      ".txt",
      ".sql",
      ".html",
      ".css",
    ];

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
      const fileExt = file.filename
        ? "." + file.filename.split(".").pop()?.toLowerCase()
        : "";

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
          language: file.language || "text",
          content: file.content || "",
          created_at: now,
          updated_at: now,
        });
      } else {
        // This is an attachment (PDF, image, etc.)
        // Check if file has base64 data or file data
        if (file.fileData || file.base64) {
          attachmentsToProcess.push({
            filename: file.filename,
            mimeType: file.mimeType || "application/octet-stream",
            fileData: file.fileData || file.base64,
            isBase64: !!file.base64 || file.fileData?.startsWith("data:"),
          });
        } else {
          return NextResponse.json(
            {
              error: `File "${file.filename}" is not a code file and no file data provided. Attachments must include file data.`,
            },
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
    }

    // Process and upload attachments
    const attachmentsToInsert: any[] = [];
    for (const attachment of attachmentsToProcess) {
      try {
        // Convert base64 to Buffer (CRITICAL: Use Buffer directly, don't convert to ArrayBuffer)
        let fileBuffer: Buffer;
        if (attachment.isBase64) {
          // Remove data URL prefix if present (e.g., "data:image/png;base64,")
          const base64Data = attachment.fileData.includes(",")
            ? attachment.fileData.split(",")[1]
            : attachment.fileData;

          // Decode base64 directly to Buffer - this is the correct way
          // DO NOT use .buffer.slice() as it corrupts the binary data
          fileBuffer = Buffer.from(base64Data, "base64");
        } else {
          // Assume it's already base64 encoded string (without data URL prefix)
          fileBuffer = Buffer.from(attachment.fileData, "base64");
        }

        // Upload to storage using raw Buffer
        const uploadResult = await uploadAttachment(
          submission.id,
          attachment.filename,
          fileBuffer,
          attachment.mimeType
        );

        if ("error" in uploadResult) {
          console.error(
            `Error uploading attachment ${attachment.filename}:`,
            uploadResult.error
          );
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
        console.error(
          `Error processing attachment ${attachment.filename}:`,
          error
        );
        return NextResponse.json(
          {
            error: `Failed to process attachment: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
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
    }

    // Validate that at least one file (code or attachment) was successfully inserted
    const totalFilesInserted = codeFiles.length + attachmentsToInsert.length;
    if (totalFilesInserted === 0) {
      // Check if this submission has any existing files
      const { data: existingCodeFiles } = await supabase
        .from("submission_code")
        .select("id")
        .eq("submission_id", submission.id)
        .limit(1);

      const { data: existingAttachments } = await supabase
        .from("submission_attachments")
        .select("id")
        .eq("submission_id", submission.id)
        .limit(1);

      // If submission has no existing files and no new files were added, delete it
      // (to prevent empty submissions from unlocking labs)
      if (
        (!existingCodeFiles || existingCodeFiles.length === 0) &&
        (!existingAttachments || existingAttachments.length === 0)
      ) {
        await supabase.from("submissions").delete().eq("id", submission.id);
      }

      return NextResponse.json(
        {
          error:
            "At least one file (code file or attachment) must be successfully uploaded",
        },
        { status: 400 }
      );
    }

    // Only unlock lab if files were successfully inserted
    // Unlock lab for this student (ignore if already exists)
    const { error: unlockError } = await supabase
      .from("lab_unlocks")
      .insert([
        {
          lab_id: labId,
          student_id: authenticatedStudentId,
        },
      ])
      .select()
      .single();

    // Ignore error if unlock already exists (unique constraint violation)
    if (unlockError && unlockError.code !== "23505") {
      // 23505 is PostgreSQL unique constraint violation - that's okay, it already exists
      console.error("Error unlocking lab:", unlockError);
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Error in upload submission API:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
