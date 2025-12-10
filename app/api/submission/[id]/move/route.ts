import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * PATCH /api/submission/[id]/move
 * Moves a submission to a different lab.
 * Only the owner can move their submission.
 * A user cannot have two submissions in the same lab.
 */
export async function PATCH(
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
        const { targetLabId } = body;

        // Validate required fields
        if (!targetLabId) {
            return NextResponse.json(
                { error: "targetLabId is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get submission to verify ownership and current lab
        const { data: submissionData, error: submissionError } = await supabase
            .from("submissions")
            .select("id, student_id, lab_id")
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
                { error: "Forbidden: Cannot move other users' submissions" },
                { status: 403 }
            );
        }

        // Check if trying to move to the same lab
        if (submissionData.lab_id === targetLabId) {
            return NextResponse.json(
                { error: "Submission is already in this lab" },
                { status: 400 }
            );
        }

        // Verify target lab exists
        const { data: targetLab, error: targetLabError } = await supabase
            .from("labs")
            .select("id, lab_number, title, course_id, courses(id, name)")
            .eq("id", targetLabId)
            .single();

        if (targetLabError || !targetLab) {
            return NextResponse.json(
                { error: "Target lab not found" },
                { status: 404 }
            );
        }

        // Check if user already has a submission in the target lab
        const { data: existingSubmission, error: existingError } = await supabase
            .from("submissions")
            .select("id")
            .eq("lab_id", targetLabId)
            .eq("student_id", studentId)
            .single();

        if (existingSubmission) {
            return NextResponse.json(
                {
                    error: `You already have a submission in "${targetLab.title}". A user cannot have multiple submissions in the same lab.`,
                },
                { status: 409 }
            );
        }

        // Move the submission to the new lab
        const { data: updatedSubmission, error: updateError } = await supabase
            .from("submissions")
            .update({
                lab_id: targetLabId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", submissionId)
            .select("*, students(id, name, email), labs(id, lab_number, title, course_id, courses(id, name, description))")
            .single();

        if (updateError) {
            console.error("Error moving submission:", updateError);
            return NextResponse.json(
                { error: "Failed to move submission" },
                { status: 500 }
            );
        }

        // Update lab_unlocks: remove old lab unlock and add new one
        // First, delete the old lab unlock (user no longer has submission in old lab)
        await supabase
            .from("lab_unlocks")
            .delete()
            .eq("lab_id", submissionData.lab_id)
            .eq("student_id", studentId);

        // Add unlock for the new lab (ignore if already exists)
        const { error: unlockError } = await supabase
            .from("lab_unlocks")
            .insert([
                {
                    lab_id: targetLabId,
                    student_id: studentId,
                },
            ])
            .select()
            .single();

        // Ignore unique constraint violation (already unlocked)
        if (unlockError && unlockError.code !== "23505") {
            console.error("Error updating lab unlock:", unlockError);
        }

        return NextResponse.json({
            success: true,
            submission: updatedSubmission,
            message: `Submission moved to "${targetLab.title}" successfully`,
        });
    } catch (error) {
        console.error("Error in move submission API:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
