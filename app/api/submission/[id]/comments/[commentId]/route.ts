import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { processAnonymousContent } from "@/lib/anonymity";

/**
 * PATCH /api/submission/[id]/comments/[commentId]
 * Updates a comment's anonymity setting.
 * Only the owner can update their comment.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;

    const { commentId } = await params;
    const body = await request.json();
    const { isAnonymous } = body;

    if (typeof isAnonymous !== 'boolean') {
      return NextResponse.json(
        { error: "isAnonymous must be a boolean" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get comment to verify ownership
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("student_id")
      .eq("id", commentId)
      .single();

    if (commentError || !commentData) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (commentData.student_id !== studentId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot update other users' comments" },
        { status: 403 }
      );
    }

    // Update anonymity
    const { data: updatedComment, error: updateError } = await supabase
      .from("comments")
      .update({ 
        is_anonymous: isAnonymous,
        updated_at: new Date().toISOString() 
      })
      .eq("id", commentId)
      .select("*, students(id, name)")
      .single();

    if (updateError) {
      console.error("Error updating comment:", updateError);
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      );
    }

    // Process anonymous display logic
    const processedComment = updatedComment 
      ? processAnonymousContent(updatedComment, studentId)
      : null;

    return NextResponse.json({
      comment: processedComment,
    });
  } catch (error) {
    console.error("Error in update comment API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submission/[id]/comments/[commentId]
 * Deletes a comment permanently.
 * Only the owner can delete their comment.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;

    const { commentId } = await params;
    const supabase = await createClient();

    // Get comment to verify ownership
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("student_id")
      .eq("id", commentId)
      .single();

    if (commentError || !commentData) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (commentData.student_id !== studentId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete other users' comments" },
        { status: 403 }
      );
    }

    // Delete comment using database function (bypasses RLS)
    // Ownership is already verified above, so this is safe
    const { error: deleteError } = await supabase.rpc('delete_comment', {
      comment_id: commentId
    });

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json(
        { 
          error: "Failed to delete comment",
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete comment API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

