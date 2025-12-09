import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin";
import pg from "pg";

const { Client } = pg;

/**
 * PATCH /api/admin/courses/[id]/labs/[labId]
 * Updates a lab's title and description.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; labId: string }> }
) {
    try {
        const authResult = await requireAuth();
        if ("error" in authResult) {
            return authResult.error;
        }
        const studentId = authResult.studentId;
        const { id: courseId, labId } = await params;

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

            // Update the lab
            const updateLabQuery = `
        UPDATE labs
        SET title = $1, description = $2, updated_at = now()
        WHERE id = $3 AND course_id = $4
        RETURNING id, lab_number, title, description, updated_at
      `;

            const labResult = await dbClient.query(updateLabQuery, [
                title.trim(),
                description?.trim() || null,
                labId,
                courseId,
            ]);

            await dbClient.end();

            if (labResult.rows.length === 0) {
                return NextResponse.json(
                    { error: "Lab not found" },
                    { status: 404 }
                );
            }

            const updatedLab = labResult.rows[0];

            return NextResponse.json({
                success: true,
                message: "Lab updated successfully.",
                lab: {
                    id: updatedLab.id,
                    lab_number: updatedLab.lab_number,
                    title: updatedLab.title,
                    description: updatedLab.description,
                    updated_at: updatedLab.updated_at,
                },
            });
        } catch (dbError: any) {
            await dbClient.end();
            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to update lab", message: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in update lab API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/courses/[id]/labs/[labId]
 * Deletes a lab and all associated submissions.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; labId: string }> }
) {
    try {
        const authResult = await requireAuth();
        if ("error" in authResult) {
            return authResult.error;
        }
        const studentId = authResult.studentId;
        const { id: courseId, labId } = await params;

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

            // Delete the lab (cascades to submissions)
            const deleteQuery = `
        DELETE FROM labs
        WHERE id = $1 AND course_id = $2
        RETURNING id
      `;

            const result = await dbClient.query(deleteQuery, [labId, courseId]);

            await dbClient.end();

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: "Lab not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Lab deleted successfully.",
            });
        } catch (dbError: any) {
            await dbClient.end();
            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to delete lab", message: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in delete lab API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}
