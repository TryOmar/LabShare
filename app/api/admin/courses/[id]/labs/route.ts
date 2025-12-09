import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin";
import pg from "pg";

const { Client } = pg;

/**
 * GET /api/admin/courses/[id]/labs
 * Returns all labs for a specific course.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth();
        if ("error" in authResult) {
            return authResult.error;
        }
        const studentId = authResult.studentId;
        const { id: courseId } = await params;

        const supabase = await createClient();

        // Check admin status
        const isAdmin = await checkIsAdmin(supabase, studentId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        // Get labs for this course
        const { data: labs, error: labsError } = await supabase
            .from("labs")
            .select("id, lab_number, title, description, created_at")
            .eq("course_id", courseId)
            .order("lab_number");

        if (labsError) {
            console.error("Error fetching labs:", labsError);
            return NextResponse.json(
                { error: "Failed to fetch labs" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            labs: labs || [],
        });
    } catch (error: any) {
        console.error("Error in labs API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/courses/[id]/labs
 * Creates a new lab for a course.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth();
        if ("error" in authResult) {
            return authResult.error;
        }
        const studentId = authResult.studentId;
        const { id: courseId } = await params;

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
        const { title, description } = await request.json();

        if (!title) {
            return NextResponse.json(
                { error: "Lab title is required" },
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

            // Get the next lab number for this course
            const maxLabQuery = `
        SELECT COALESCE(MAX(lab_number), 0) + 1 as next_number
        FROM labs
        WHERE course_id = $1
      `;
            const maxLabResult = await dbClient.query(maxLabQuery, [courseId]);
            const nextLabNumber = maxLabResult.rows[0].next_number;

            // Insert the new lab
            const insertLabQuery = `
        INSERT INTO labs (course_id, lab_number, title, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id, lab_number, title, description, created_at
      `;

            const labResult = await dbClient.query(insertLabQuery, [
                courseId,
                nextLabNumber,
                title.trim(),
                description?.trim() || null,
            ]);

            const newLab = labResult.rows[0];

            await dbClient.end();

            return NextResponse.json({
                success: true,
                message: "Lab created successfully.",
                lab: {
                    id: newLab.id,
                    lab_number: newLab.lab_number,
                    title: newLab.title,
                    description: newLab.description,
                    created_at: newLab.created_at,
                },
            });
        } catch (dbError: any) {
            await dbClient.end();

            if (dbError.code === "23505") {
                return NextResponse.json(
                    {
                        error: "Lab number conflict",
                        message: "A lab with this number already exists for this course.",
                    },
                    { status: 409 }
                );
            }

            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to create lab", message: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in create lab API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}
