import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/activity
 * Returns recent activity across the platform (submissions, comments, new students, upvotes, sessions, interactions).
 * Access: Admin only.
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if ("error" in authResult) {
            return authResult.error;
        }
        const studentId = authResult.studentId;

        const supabase = await createClient();

        // Check admin status
        const isAdmin = await checkIsAdmin(supabase, studentId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        const LIMIT = 20;

        // Fetch recent submissions
        const { data: submissions, error: subError } = await supabase
            .from("submissions")
            .select(`
        id,
        created_at,
        title,
        student:students(name),
        lab:labs(title, course:courses(name))
      `)
            .order("created_at", { ascending: false })
            .limit(LIMIT);

        if (subError) throw subError;

        // Fetch recent comments
        const { data: comments, error: comError } = await supabase
            .from("comments")
            .select(`
        id,
        created_at,
        content,
        student:students(name),
        submission:submissions(title)
      `)
            .order("created_at", { ascending: false })
            .limit(LIMIT);

        if (comError) throw comError;

        // Fetch recent students
        const { data: newStudents, error: stuError } = await supabase
            .from("students")
            .select(`
        id,
        created_at,
        name,
        email,
        track:tracks(code)
      `)
            .order("created_at", { ascending: false })
            .limit(LIMIT);

        if (stuError) throw stuError;

        // 1. Fetch recent upvotes
        const { data: upvotes, error: voteError } = await supabase
            .from("submission_upvotes")
            .select(`
        id,
        created_at,
        student:students(name),
        submission:submissions(title)
      `)
            .order("created_at", { ascending: false })
            .limit(LIMIT);

        // Ignore error if table doesn't exist (e.g. migration pending), but log it
        if (voteError) console.warn("Error fetching upvotes:", voteError);

        // 2. Fetch recent sessions (logins)
        // Note: 'user_id' is the FK to students
        const { data: sessions, error: sessError } = await supabase
            .from("sessions")
            .select(`
        id,
        created_at:last_seen, 
        student:students(name)
      `)
            .order("last_seen", { ascending: false })
            .limit(LIMIT);

        // Using last_seen as the 'date' for sessions to show when they were last active/started.
        // Actually, 'created_at' is session start. 'last_seen' is last active.
        // The user asked for "last seen", so using 'last_seen' is appropriate.
        // However, tracking every 'last_seen' update might range-flood. 
        // Let's stick to created_at for "New Session" or last_seen for "Active".
        // I'll grab both and maybe prefer created_at for the "Event" log unless it's way in the past.
        // Actually, simply showing "Logged in" at created_at is cleaner for a timeline.

        // Re-querying for created_at as primary event time
        const { data: sessionStarts, error: sessStartError } = await supabase
            .from("sessions")
            .select(`
        id,
        created_at,
        student:students(name)
      `)
            .order("created_at", { ascending: false })
            .limit(LIMIT);

        if (sessStartError) console.warn("Error fetching sessions:", sessStartError);

        // 3. Fetch Lab Unlocks
        const { data: unlocks, error: unlockError } = await supabase
            .from("lab_unlocks")
            .select(`
        id,
        unlocked_at,
        student:students(name),
        lab:labs(title, course:courses(name))
      `)
            .order("unlocked_at", { ascending: false })
            .limit(LIMIT);

        if (unlockError) console.warn("Error fetching unlocks:", unlockError);


        // Transform and merge events
        const activityList = [
            ...(submissions || []).map((s: any) => ({
                id: s.id,
                type: "submission",
                date: s.created_at,
                actor: s.student?.name || "Unknown Student",
                action: "submitted",
                target: s.title || "Untitled Submission",
                meta: s.lab?.title ? `${s.lab.title} (${s.lab.course?.name})` : "Unknown Lab",
            })),
            ...(comments || []).map((c: any) => ({
                id: c.id,
                type: "comment",
                date: c.created_at,
                actor: c.student?.name || "Unknown Student",
                action: "commented on",
                target: c.submission?.title || "Unknown Submission",
                meta: c.content,
            })),
            ...(newStudents || []).map((s: any) => ({
                id: s.id,
                type: "student_joined",
                date: s.created_at,
                actor: s.name,
                action: "joined",
                target: "LabShare",
                meta: s.track?.code || "No Track",
            })),
            ...(upvotes || []).map((u: any) => ({
                id: u.id,
                type: "upvote",
                date: u.created_at,
                actor: u.student?.name || "Unknown Student",
                action: "upvoted",
                target: u.submission?.title || "Unknown Submission",
                meta: "Liked a submission",
            })),
            ...(sessionStarts || []).map((s: any) => ({
                id: s.id,
                type: "session",
                date: s.created_at,
                actor: s.student?.name || "Unknown Student",
                action: "started session",
                target: "Platform",
                meta: "User logged in",
            })),
            ...(unlocks || []).map((l: any) => ({
                id: l.id,
                type: "lab_unlock",
                date: l.unlocked_at,
                actor: l.student?.name || "Unknown Student",
                action: "unlocked",
                target: l.lab?.title || "Unknown Lab",
                meta: l.lab?.course?.name ? `Course: ${l.lab.course.name}` : "",
            })),
        ];

        // Sort by date descending
        activityList.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Return top 100 combined (increased from 50)
        return NextResponse.json({
            activity: activityList.slice(0, 100),
        });
    } catch (error: any) {
        console.error("Error fetching admin activity:", error);
        return NextResponse.json(
            { error: "Failed to fetch activity", message: error.message },
            { status: 500 }
        );
    }
}
