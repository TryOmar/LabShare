import { getSubmissionAnonymityStatus } from "@/lib/anonymity";

/**
 * Options for creating auto-log comments
 */
export interface AutoLogOptions {
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

/**
 * Creates an auto-log comment for file operations in submissions.
 * Auto-log comments inherit the anonymity status from the submission.
 * 
 * @param supabase - Supabase client instance
 * @param submissionId - ID of the submission
 * @param studentId - ID of the student performing the action
 * @param options - Options describing the file operation
 * @returns Promise that resolves when the comment is created (or silently fails)
 * 
 * @example
 * ```ts
 * await createAutoLogComment(supabase, submissionId, studentId, {
 *   type: 'file_add',
 *   filename: 'app.js',
 *   isCodeFile: true
 * });
 * ```
 */
export async function createAutoLogComment(
  supabase: Awaited<ReturnType<typeof import('./supabase/server').createClient>>,
  submissionId: string,
  studentId: string,
  options: AutoLogOptions
): Promise<void> {
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
    // Log error for debugging but don't throw
    console.error("Error creating auto-log comment:", error);
  }
}

