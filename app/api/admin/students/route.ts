import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import pg from "pg";

const { Client } = pg;

/**
 * POST /api/admin/students
 * Adds a new student (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;

    const supabase = await createClient();

    // Get student email
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

    // Check if user is admin
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
    const { name, email, trackCode } = await request.json();

    if (!name || !email || !trackCode) {
      return NextResponse.json(
        { error: "Name, email, and track code are required" },
        { status: 400 }
      );
    }

    // Validate environment variables
    const DATABASE_URL = process.env.DATABASE_URL?.trim();
    const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://lab-share.vercel.app';

    if (!DATABASE_URL) {
      console.error("Missing DATABASE_URL in .env.local");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY in .env.local");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get the track ID
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, code, name")
      .eq("code", trackCode)
      .single();

    if (trackError || !track) {
      return NextResponse.json(
        { error: `Track with code "${trackCode}" not found` },
        { status: 404 }
      );
    }

    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id, name, email")
      .ilike("email", email)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        { 
          error: "Student already exists",
          message: `Student with email ${email} already exists.`,
          student: existingStudent
        },
        { status: 409 }
      );
    }

    // Insert the new student using direct database connection
    const dbClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await dbClient.connect();

      const insertQuery = `
        INSERT INTO students (name, email, track_id)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at
      `;

      const result = await dbClient.query(insertQuery, [
        name,
        email,
        track.id
      ]);

      const newStudent = result.rows[0];

      // Send notification email
      try {
        const resend = new Resend(RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'LabShare@tryomar.me',
          to: email,
          subject: 'Welcome to LabShare - You\'ve been added!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Welcome to LabShare, ${name}!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                You have been successfully added to the LabShare platform. You can now access the system and start sharing your lab solutions with other students.
              </p>
              <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="color: #333; font-size: 14px; margin: 0;">
                  <strong>Your Account Details:</strong><br>
                  Email: ${email}
                </p>
              </div>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                To get started, simply visit the login page and enter your email address. You'll receive a verification code to access your account.
              </p>
              <div style="margin: 30px 0;">
                <a href="${APP_URL}/login" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Go to Login Page
                </a>
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                If you have any questions or need assistance, please don't hesitate to reach out.
              </p>
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                The LabShare Team
              </p>
            </div>
          `
        });
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails
      }

      await dbClient.end();

      return NextResponse.json({
        success: true,
        message: "Student added successfully and welcome email sent.",
        student: {
          id: newStudent.id,
          name: newStudent.name,
          email: newStudent.email,
          track: track.name,
          createdAt: newStudent.created_at,
        },
      });
    } catch (dbError: any) {
      await dbClient.end();
      
      if (dbError.code === '23505') {
        return NextResponse.json(
          { 
            error: "Student already exists",
            message: `Student with email ${email} already exists in the database.`
          },
          { status: 409 }
        );
      }

      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to add student", message: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in add student API:", error);
    return NextResponse.json(
      { error: "An error occurred", message: error.message },
      { status: 500 }
    );
  }
}

