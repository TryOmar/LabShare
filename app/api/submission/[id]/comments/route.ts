import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { processAnonymousContentArray, processAnonymousContent } from "@/lib/anonymity";

/**
 * GET /api/submission/[id]/comments
 * Returns comments for a submission.
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

    const { id: submissionId } = await params;
    const supabase = await createClient();

    // Get authenticated student ID for checking ownership
    const currentStudentId = authResult.studentId;

    // Get comments for this submission
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("*, students(id, name)")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Hide student info for anonymous comments (unless user is the owner)
    const processedComments = processAnonymousContentArray(commentsData || [], currentStudentId);

    return NextResponse.json({
      comments: processedComments,
    });
  } catch (error) {
    console.error("Error in comments API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/submission/[id]/comments
 * Creates a new comment on a submission.
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
    const body = await request.json();
    const { content, isAnonymous } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert comment
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .insert([
        {
          submission_id: submissionId,
          student_id: studentId,
          content: content.trim(),
          is_anonymous: isAnonymous === true,
        },
      ])
      .select("*, students(id, name)")
      .single();

    if (commentError) {
      console.error("Error creating comment:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Process anonymous display logic
    const processedComment = commentData 
      ? processAnonymousContent(commentData, studentId)
      : null;

    return NextResponse.json({
      comment: processedComment,
    });
  } catch (error) {
    console.error("Error in create comment API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

