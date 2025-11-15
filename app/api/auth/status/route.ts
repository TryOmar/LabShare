import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStudentId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/status
 * Returns the current authentication status and user info.
 * Used by client pages to check if user is already logged in.
 */
export async function GET(request: NextRequest) {
  try {
    const studentId = await getAuthenticatedStudentId();

    if (!studentId) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    // Get student info
    const supabase = await createClient();
    const { data: student, error } = await supabase
      .from("students")
      .select("id, name, email")
      .eq("id", studentId)
      .single();

    if (error || !student) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
    });
  } catch (error) {
    console.error("Error in auth status API:", error);
    return NextResponse.json({
      authenticated: false,
    });
  }
}

