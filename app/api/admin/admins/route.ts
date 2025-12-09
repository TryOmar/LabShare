import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import pg from "pg";

const { Client } = pg;

/**
 * POST /api/admin/admins
 * Adds a new admin (admin only).
 * The admins table only stores email addresses for privilege checking.
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if ("error" in authResult) {
            return authResult.error;
        }
        const studentId = authResult.studentId;

        const supabase = await createClient();

        // Get student email to check if current user is admin
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("email")
            .eq("id", studentId)
            .single();

        if (studentError || !student) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        // Check if current user is admin
        const { data: admin, error: adminError } = await supabase
            .from("admins")
            .select("email")
            .ilike("email", student.email)
            .single();

        if (adminError || !admin) {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 403 }
            );
        }

        // Parse request body
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if the email exists in admins table already
        const { data: existingAdmin } = await supabase
            .from("admins")
            .select("email")
            .ilike("email", email)
            .single();

        if (existingAdmin) {
            return NextResponse.json(
                {
                    error: "Admin already exists",
                    message: `User with email ${email} is already an admin.`,
                },
                { status: 409 }
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

        // Insert the new admin using direct database connection
        const dbClient = new Client({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false },
        });

        try {
            await dbClient.connect();

            const insertQuery = `
        INSERT INTO admins (email)
        VALUES ($1)
        RETURNING id, email, created_at
      `;

            const result = await dbClient.query(insertQuery, [email.trim()]);

            const newAdmin = result.rows[0];

            await dbClient.end();

            return NextResponse.json({
                success: true,
                message: "Admin added successfully.",
                admin: {
                    id: newAdmin.id,
                    email: newAdmin.email,
                    createdAt: newAdmin.created_at,
                },
            });
        } catch (dbError: any) {
            await dbClient.end();

            if (dbError.code === "23505") {
                return NextResponse.json(
                    {
                        error: "Admin already exists",
                        message: `User with email ${email} is already an admin.`,
                    },
                    { status: 409 }
                );
            }

            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to add admin", message: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in add admin API:", error);
        return NextResponse.json(
            { error: "An error occurred", message: error.message },
            { status: 500 }
        );
    }
}

