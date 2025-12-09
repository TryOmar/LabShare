import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { checkIsAdmin } from "@/lib/auth/admin";

/**
 * Submission preview for labs page accordion
 */
interface SubmissionPreview {
    id: string;
    title: string;
    studentName: string;
    isAnonymous: boolean;
    createdAt: string;
    upvoteCount: number;
    viewCount: number;
}

/**
 * GET /api/labs/submissions
 * Returns submission previews for labs (used in accordion view).
 * Users can see submission titles/metadata without having submitted.
 * Student names are anonymized if the user hasn't unlocked the lab.
 */
export async function GET(request: NextRequest) {
    try {
        // Validate authentication
        const authResult = await requireAuth();
        if ("error" in authResult) {
            return authResult.error;
        }
        const studentId = authResult.studentId;

        const { searchParams } = new URL(request.url);
        const labId = searchParams.get("labId");

        if (!labId) {
            return NextResponse.json(
                { error: "Lab ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check if user has submitted to this lab
        const { data: userSubmission } = await supabase
            .from("submissions")
            .select("id")
            .eq("lab_id", labId)
            .eq("student_id", studentId)
            .single();

        const hasSubmitted = !!userSubmission;

        // Check if user is an admin
        const isAdmin = await checkIsAdmin(supabase, studentId);

        // Get all submissions for this lab (preview only)
        const { data: submissions, error: submissionsError } = await supabase
            .from("submissions")
            .select("id, title, is_anonymous, created_at, upvote_count, view_count, student_id, students(id, name)")
            .eq("lab_id", labId)
            .order("created_at", { ascending: false });

        if (submissionsError) {
            console.error("Error fetching submissions:", submissionsError);
            return NextResponse.json(
                { error: "Failed to fetch submissions" },
                { status: 500 }
            );
        }

        // Process submissions - show real names unless submission is anonymous
        const processedSubmissions: SubmissionPreview[] = (submissions || []).map((submission: any) => {
            const isOwner = submission.student_id === studentId;

            let studentName: string;
            if (submission.is_anonymous && !isOwner) {
                // Respect anonymous setting - hide name for anonymous submissions
                studentName = "Anonymous";
            } else {
                // Show actual student name (even for locked labs)
                studentName = submission.students?.name || "Unknown";
            }

            return {
                id: submission.id,
                title: submission.title,
                studentName,
                isAnonymous: submission.is_anonymous,
                createdAt: submission.created_at,
                upvoteCount: submission.upvote_count || 0,
                viewCount: submission.view_count || 0,
            };
        });

        return NextResponse.json({
            submissions: processedSubmissions,
            hasSubmitted,
            isAdmin,
            totalCount: processedSubmissions.length,
        });
    } catch (error) {
        console.error("Error in labs submissions API:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
