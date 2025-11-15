import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Validates the studentId cookie and returns the authenticated student ID.
 * This ensures that API routes can only be accessed by authenticated users
 * and prevents cookie manipulation attacks.
 * 
 * @returns The authenticated student ID, or null if not authenticated
 */
export async function getAuthenticatedStudentId(): Promise<string | null> {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("studentId")?.value;
  
  if (!studentId) {
    return null;
  }

  // Verify that the studentId exists in the database
  // This prevents using a manipulated cookie with a fake studentId
  const supabase = await createClient();
  const { data: student, error } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .single();

  if (error || !student) {
    return null;
  }

  return studentId;
}

/**
 * Validates authentication and returns an error response if not authenticated.
 * Use this in API routes that require authentication.
 * 
 * @returns An object with either { studentId: string } or { error: NextResponse }
 */
export async function requireAuth(): Promise<
  | { studentId: string }
  | { error: NextResponse }
> {
  const studentId = await getAuthenticatedStudentId();

  if (!studentId) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { studentId };
}

/**
 * Validates that the provided studentId matches the authenticated user.
 * Use this to prevent users from accessing/modifying other users' data.
 * 
 * @param requestedStudentId - The studentId from the request (query param, body, etc.)
 * @returns An object with either { studentId: string } or { error: NextResponse }
 */
export async function validateStudentId(
  requestedStudentId: string | null | undefined
): Promise<
  | { studentId: string }
  | { error: NextResponse }
> {
  const authResult = await requireAuth();
  
  if ("error" in authResult) {
    return authResult;
  }

  const authenticatedStudentId = authResult.studentId;

  // If a studentId was provided in the request, it must match the authenticated user
  if (requestedStudentId && requestedStudentId !== authenticatedStudentId) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Cannot access other users' data" },
        { status: 403 }
      ),
    };
  }

  return { studentId: authenticatedStudentId };
}

