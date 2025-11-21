import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/status
 * Returns whether the authenticated user is an admin.
 */
export async function GET(request: NextRequest) {
  try {
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

    // Check if email exists in admins table
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("email")
      .ilike("email", student.email)
      .single();

    const isAdmin = !adminError && admin !== null;

    return NextResponse.json({
      isAdmin,
    });
  } catch (error) {
    console.error("Error in admin status API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

