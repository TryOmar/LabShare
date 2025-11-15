import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/submission/upload
 * Creates or updates a submission with files.
 * Uses the authenticated studentId from the cookie (validated server-side).
 * This prevents users from submitting on behalf of other users.
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
    const { labId, title, files } = body;

    // Validate required fields
    if (!labId || !title || !files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "labId, title, and files are required" },
        { status: 400 }
      );
    }

    // Note: We use authenticatedStudentId from the cookie, not from the request body
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
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", submission.id);

      if (updateError) {
        console.error("Error updating submission:", updateError);
        return NextResponse.json(
          { error: "Failed to update submission" },
          { status: 500 }
        );
      }
    }

    // Create new version
    const { data: version, error: versionError } = await supabase
      .from("submission_versions")
      .insert([
        {
          submission_id: submission.id,
          version_number: 1,
        },
      ])
      .select()
      .single();

    if (versionError || !version) {
      console.error("Error creating version:", versionError);
      return NextResponse.json(
        { error: "Failed to create version" },
        { status: 500 }
      );
    }

    // Insert files
    const filesToInsert = files.map((file: any) => ({
      version_id: version.id,
      filename: file.filename,
      language: file.language,
      content: file.content,
    }));

    const { error: filesError } = await supabase
      .from("submission_files")
      .insert(filesToInsert);

    if (filesError) {
      console.error("Error inserting files:", filesError);
      return NextResponse.json(
        { error: "Failed to insert files" },
        { status: 500 }
      );
    }

    // Unlock lab for this student (ignore if already exists)
    await supabase
      .from("lab_unlocks")
      .insert([
        {
          lab_id: labId,
          student_id: authenticatedStudentId,
        },
      ])
      .select()
      .single()
      .catch(() => {
        // Ignore if already exists
      });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Error in upload submission API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

