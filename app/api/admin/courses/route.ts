import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin";
import pg from "pg";

const { Client } = pg;

/**
 * GET /api/admin/courses
 * Returns all courses with their assigned tracks.
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

        // Get all courses
        const { data: courses, error: coursesError } = await supabase
            .from("courses")
            .select("id, name, description")
            .order("name");

        if (coursesError) {
            console.error("Error fetching courses:", coursesError);
            return NextResponse.json(
                { error: "Failed to fetch courses" },
                { status: 500 }
            );
        }

        // Get course-track relationships
        const { data: courseTrackData, error: ctError } = await supabase
            .from("course_track")
            .select("course_id, track_id, tracks(id, code, name)");

        if (ctError) {
            console.error("Error fetching course tracks:", ctError);
            return NextResponse.json(
                { error: "Failed to fetch course tracks" },
                { status: 500 }
            );
        }

        // Map tracks to courses
        const tracksByCourse: Record<string, any[]> = {};
        (courseTrackData || []).forEach((ct: any) => {
            if (!tracksByCourse[ct.course_id]) {
                tracksByCourse[ct.course_id] = [];
            }
            if (ct.tracks) {
                tracksByCourse[ct.course_id].push(ct.tracks);
            }
        });

        const coursesWithTracks = (courses || []).map((course) => ({
            ...course,
            tracks: tracksByCourse[course.id] || [],
        }));

        return NextResponse.json({
            courses: coursesWithTracks,
        });
    } catch (error: any) {
        console.error("Error in courses API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/courses
 * Creates a new course with track assignments.
 */
export async function POST(request: NextRequest) {
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

        // Parse request body
        const { name, description, trackIds } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Course name is required" },
                { status: 400 }
            );
        }

        if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
            return NextResponse.json(
                { error: "At least one track must be selected" },
                { status: 400 }
            );
        }

        // Validate environment variables
        const DATABASE_URL = process.env.DATABASE_URL?.trim();

        if (!DATABASE_URL) {
            console.error("Missing DATABASE_URL in .env.local");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const dbClient = new Client({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false },
        });

        try {
            await dbClient.connect();

            // Insert the course
            const insertCourseQuery = `
        INSERT INTO courses (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at
      `;

            const courseResult = await dbClient.query(insertCourseQuery, [
                name.trim(),
                description?.trim() || null,
            ]);

            const newCourse = courseResult.rows[0];

            // Insert course-track relationships
            for (const trackId of trackIds) {
                const insertCTQuery = `
          INSERT INTO course_track (course_id, track_id)
          VALUES ($1, $2)
          ON CONFLICT (course_id, track_id) DO NOTHING
        `;
                await dbClient.query(insertCTQuery, [newCourse.id, trackId]);
            }

            await dbClient.end();

            return NextResponse.json({
                success: true,
                message: "Course created successfully.",
                course: {
                    id: newCourse.id,
                    name: newCourse.name,
                    description: newCourse.description,
                    createdAt: newCourse.created_at,
                },
            });
        } catch (dbError: any) {
            await dbClient.end();

            if (dbError.code === "23505") {
                return NextResponse.json(
                    {
                        error: "Course already exists",
                        message: `A course with this name already exists.`,
                    },
                    { status: 409 }
                );
            }

            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to create course", message: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in create course API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}
