import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/submission/[id]/upvote
 * Check if the current user has upvoted this submission.
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

    // Check if user has upvoted this submission
    const { data: upvote, error: upvoteError } = await supabase
      .from("submission_upvotes")
      .select("id")
      .eq("student_id", studentId)
      .eq("submission_id", submissionId)
      .single();

    if (upvoteError && upvoteError.code !== "PGRST116") {
      // PGRST116 is "not found" - that's okay, means no upvote
      console.error("Error checking upvote:", upvoteError);
      return NextResponse.json(
        { error: "Failed to check upvote status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      upvoted: upvote !== null,
    });
  } catch (error) {
    console.error("Error in get upvote API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/submission/[id]/upvote
 * Toggle upvote for a submission (add if not exists, remove if exists).
 * Students cannot upvote their own submissions.
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
    const studentId = authResult.studentId;
    const { id: submissionId } = await params;

    const supabase = await createClient();

    // Get submission to check ownership
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("student_id, upvote_count")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Prevent self-upvoting
    if (submission.student_id === studentId) {
      return NextResponse.json(
        { error: "You cannot upvote your own submission" },
        { status: 403 }
      );
    }

    // Check if upvote already exists
    const { data: existingUpvote, error: checkError } = await supabase
      .from("submission_upvotes")
      .select("id")
      .eq("student_id", studentId)
      .eq("submission_id", submissionId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" - that's okay
      console.error("Error checking existing upvote:", checkError);
      return NextResponse.json(
        { error: "Failed to check upvote status" },
        { status: 500 }
      );
    }

    let isUpvoted: boolean;
    let finalCount: number;

    if (existingUpvote) {
      // Remove upvote
      const { error: deleteError } = await supabase
        .from("submission_upvotes")
        .delete()
        .eq("id", existingUpvote.id);

      if (deleteError) {
        console.error("Error removing upvote:", deleteError);
        return NextResponse.json(
          { error: "Failed to remove upvote" },
          { status: 500 }
        );
      }

      isUpvoted = false;
    } else {
      // Add upvote
      const { error: insertError } = await supabase
        .from("submission_upvotes")
        .insert([
          {
            student_id: studentId,
            submission_id: submissionId,
          },
        ]);

      if (insertError) {
        console.error("Error adding upvote:", insertError);
        return NextResponse.json(
          { error: "Failed to add upvote" },
          { status: 500 }
        );
      }

      isUpvoted = true;
    }

    // Update submission upvote count using the database function
    const { error: updateError } = await supabase.rpc(
      "update_submission_upvote_count",
      {
        submission_id_param: submissionId,
      }
    );

    if (updateError) {
      console.error("Error updating upvote count:", updateError);
      // Don't fail the request, just log the error
    }

    // Get updated count
    const { data: updatedSubmission, error: fetchError } = await supabase
      .from("submissions")
      .select("upvote_count")
      .eq("id", submissionId)
      .single();

    if (fetchError || !updatedSubmission) {
      console.error("Error fetching updated count:", fetchError);
      finalCount = submission.upvote_count + (isUpvoted ? 1 : -1);
    } else {
      finalCount = updatedSubmission.upvote_count;
    }

    return NextResponse.json({
      upvoted: isUpvoted,
      upvoteCount: finalCount,
    });
  } catch (error) {
    console.error("Error in toggle upvote API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

