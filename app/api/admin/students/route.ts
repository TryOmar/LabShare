import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin";
import { Resend } from "resend";
import pg from "pg";

const { Client } = pg;

/**
 * GET /api/admin/students
 * Returns all students with their admin status (admin only).
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

    // Get all students with track info
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id, name, email, track_id, created_at, tracks(id, code, name)")
      .order("created_at", { ascending: false });

    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      return NextResponse.json(
        { error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    // Get all admin emails
    const { data: admins, error: adminsError } = await supabase
      .from("admins")
      .select("email");

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
    }

    // Create a set of admin emails (lowercase for case-insensitive comparison)
    const adminEmails = new Set(
      (admins || []).map((a: any) => a.email.toLowerCase())
    );

    // Add isAdmin flag to each student
    const studentsWithAdmin = (students || []).map((student: any) => ({
      ...student,
      isAdmin: adminEmails.has(student.email.toLowerCase()),
    }));

    return NextResponse.json({
      students: studentsWithAdmin,
    });
  } catch (error: any) {
    console.error("Error in students API:", error);
    return NextResponse.json(
      { error: "An error occurred", message: error.message },
      { status: 500 }
    );
  }
}

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

    // Check admin status
    const isAdmin = await checkIsAdmin(supabase, studentId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const { name, email, trackCode, makeAdmin } = await request.json();

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

      // If makeAdmin is true, add to admins table
      if (makeAdmin) {
        try {
          await dbClient.query(
            `INSERT INTO admins (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
            [email]
          );
        } catch (adminErr) {
          console.error("Error adding admin:", adminErr);
        }
      }

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
          isAdmin: makeAdmin || false,
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

/**
 * PATCH /api/admin/students
 * Updates a student's details or admin status (admin only).
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { targetStudentId } = body;

    if (!targetStudentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get the current student data
    const { data: currentStudent, error: studentError } = await supabase
      .from("students")
      .select("email, name, track_id")
      .eq("id", targetStudentId)
      .single();

    if (studentError || !currentStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const DATABASE_URL = process.env.DATABASE_URL?.trim();
    if (!DATABASE_URL) {
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

      // Check if this is an admin status toggle request
      if (typeof body.isAdmin === "boolean") {
        const setAdmin = body.isAdmin;

        if (setAdmin) {
          // Add to admins table
          await dbClient.query(
            `INSERT INTO admins (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
            [currentStudent.email]
          );
        } else {
          // Remove from admins table
          await dbClient.query(
            `DELETE FROM admins WHERE lower(email) = lower($1)`,
            [currentStudent.email]
          );
        }

        await dbClient.end();

        return NextResponse.json({
          success: true,
          message: setAdmin ? "Admin privileges granted." : "Admin privileges revoked.",
        });
      }

      // Check if this is a student details update request
      if (body.name || body.email || body.trackCode) {
        const { name, email, trackCode } = body;

        // Prepare update data
        const updates: any = {};
        const updateParams: any[] = [];
        let paramIndex = 1;

        if (name) {
          updates.name = name.trim();
          updateParams.push(updates.name);
        }

        if (email) {
          const newEmail = email.trim();
          // Check for duplicate email if email is changing
          if (newEmail.toLowerCase() !== currentStudent.email.toLowerCase()) {
            const emailCheck = await dbClient.query(
              "SELECT id FROM students WHERE lower(email) = lower($1) AND id != $2",
              [newEmail, targetStudentId]
            );

            if (emailCheck.rows.length > 0) {
              await dbClient.end();
              return NextResponse.json(
                { error: "Email already in use", message: `The email ${newEmail} is already used by another student.` },
                { status: 409 }
              );
            }
          }
          updates.email = newEmail;
          updateParams.push(updates.email);
        }

        if (trackCode) {
          // Get track ID
          const trackRes = await dbClient.query(
            "SELECT id FROM tracks WHERE code = $1",
            [trackCode]
          );

          if (trackRes.rows.length === 0) {
            await dbClient.end();
            return NextResponse.json(
              { error: "Track not found" },
              { status: 404 }
            );
          }
          updates.track_id = trackRes.rows[0].id;
          updateParams.push(updates.track_id);
        }

        if (updateParams.length === 0) {
          await dbClient.end();
          return NextResponse.json(
            { error: "No fields to update" },
            { status: 400 }
          );
        }

        // Construct dynamic UPDATE query
        const setClause = Object.keys(updates)
          .map((key, idx) => `${key} = $${idx + 1}`)
          .join(", ");

        // Add ID parameter at the end
        updateParams.push(targetStudentId);

        await dbClient.query(
          `UPDATE students SET ${setClause} WHERE id = $${updateParams.length}`,
          updateParams
        );

        // If email changed, we might need to update admins table if user is an admin
        // Note: The admins table is separate and links by email, so if email changes in students,
        // it should ideally also change in admins table to maintain admin status.
        if (updates.email && updates.email.toLowerCase() !== currentStudent.email.toLowerCase()) {
          // Check if old email was admin
          const adminCheck = await dbClient.query(
            "SELECT id FROM admins WHERE lower(email) = lower($1)",
            [currentStudent.email]
          );

          if (adminCheck.rows.length > 0) {
            // Update admin email too
            await dbClient.query(
              "UPDATE admins SET email = $1 WHERE lower(email) = lower($2)",
              [updates.email, currentStudent.email]
            );
          }
        }

        await dbClient.end();

        return NextResponse.json({
          success: true,
          message: "Student details updated successfully.",
        });
      }

      await dbClient.end();
      return NextResponse.json(
        { error: "Invalid update request" },
        { status: 400 }
      );

    } catch (dbError: any) {
      await dbClient.end();
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to update student", message: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in update student API:", error);
    return NextResponse.json(
      { error: "An error occurred", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/students
 * Deletes a student (admin only).
 * Prevents deletion if student has any submissions.
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const targetStudentId = searchParams.get("id");

    if (!targetStudentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (targetStudentId === studentId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if student has any submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id")
      .eq("student_id", targetStudentId);

    if (submissionsError) {
      console.error("Error checking submissions:", submissionsError);
      return NextResponse.json(
        { error: "Failed to check student submissions" },
        { status: 500 }
      );
    }

    if (submissions && submissions.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete student with submissions",
          message: `This student has ${submissions.length} submission(s). Please delete their submissions first before removing the student.`,
          submissionCount: submissions.length
        },
        { status: 409 }
      );
    }

    const DATABASE_URL = process.env.DATABASE_URL?.trim();
    if (!DATABASE_URL) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get student email first (for admin removal)
    const { data: student } = await supabase
      .from("students")
      .select("email, name")
      .eq("id", targetStudentId)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const dbClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await dbClient.connect();

      // Remove from admins table if present
      if (student?.email) {
        await dbClient.query(
          `DELETE FROM admins WHERE lower(email) = lower($1)`,
          [student.email]
        );
      }

      // Delete the student
      const result = await dbClient.query(
        `DELETE FROM students WHERE id = $1 RETURNING id`,
        [targetStudentId]
      );

      await dbClient.end();

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Student "${student.name}" deleted successfully.`,
      });
    } catch (dbError: any) {
      await dbClient.end();
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete student", message: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in delete student API:", error);
    return NextResponse.json(
      { error: "An error occurred", message: error.message },
      { status: 500 }
    );
  }
}
