import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin";
import pg from "pg";

const { Client } = pg;

/**
 * PATCH /api/admin/courses/[id]
 * Updates a course's details and track assignments.
 */
export async function PATCH(
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
        const { name, description, trackIds } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Course name is required" },
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

            // Update the course
            const updateCourseQuery = `
        UPDATE courses
        SET name = $1, description = $2, updated_at = now()
        WHERE id = $3
        RETURNING id, name, description, updated_at
      `;

            const courseResult = await dbClient.query(updateCourseQuery, [
                name.trim(),
                description?.trim() || null,
                courseId,
            ]);

            if (courseResult.rows.length === 0) {
                await dbClient.end();
                return NextResponse.json(
                    { error: "Course not found" },
                    { status: 404 }
                );
            }

            const updatedCourse = courseResult.rows[0];

            // Update course-track relationships if provided
            if (trackIds && Array.isArray(trackIds)) {
                // Delete existing relationships
                await dbClient.query(
                    "DELETE FROM course_track WHERE course_id = $1",
                    [courseId]
                );

                // Insert new relationships
                for (const trackId of trackIds) {
                    const insertCTQuery = `
            INSERT INTO course_track (course_id, track_id)
            VALUES ($1, $2)
            ON CONFLICT (course_id, track_id) DO NOTHING
          `;
                    await dbClient.query(insertCTQuery, [courseId, trackId]);
                }
            }

            await dbClient.end();

            return NextResponse.json({
                success: true,
                message: "Course updated successfully.",
                course: {
                    id: updatedCourse.id,
                    name: updatedCourse.name,
                    description: updatedCourse.description,
                    updatedAt: updatedCourse.updated_at,
                },
            });
        } catch (dbError: any) {
            await dbClient.end();
            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to update course", message: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in update course API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/courses/[id]
 * Deletes a course and all associated data.
 * Prevents deletion if the course has any submissions.
 */
export async function DELETE(
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

            // Check for existing submissions
            const submissionCheckQuery = `
                SELECT COUNT(*) as count 
                FROM submissions s
                JOIN labs l ON s.lab_id = l.id
                WHERE l.course_id = $1
            `;

            const submissionCheckResult = await dbClient.query(submissionCheckQuery, [courseId]);
            const submissionCount = parseInt(submissionCheckResult.rows[0].count, 10);

            if (submissionCount > 0) {
                await dbClient.end();
                return NextResponse.json(
                    { error: `Cannot delete course. It has ${submissionCount} submission(s) associated with it.` },
                    { status: 400 }
                );
            }

            // Delete the course (cascades to course_track and labs)
            const deleteQuery = `
        DELETE FROM courses
        WHERE id = $1
        RETURNING id
      `;

            const result = await dbClient.query(deleteQuery, [courseId]);

            await dbClient.end();

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: "Course not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Course deleted successfully.",
            });
        } catch (dbError: any) {
            await dbClient.end();
            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to delete course", message: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in delete course API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}
