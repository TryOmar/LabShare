import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { verifySession } from "@/lib/auth/sessions";
import { getFingerprintFromCookies } from "@/lib/auth/fingerprint";

/**
 * Validates the JWT token and session, returning the authenticated user ID.
 * This ensures that API routes can only be accessed by authenticated users
 * with valid sessions bound to device fingerprints.
 *
 * The authentication flow:
 * 1. Extract JWT from access_token cookie
 * 2. Extract fingerprint from fingerprint cookie
 * 3. Verify JWT → get session_id
 * 4. Verify session in DB → get user_id
 * 5. Handle fingerprint mismatch (revoke session, clear cookies)
 * 6. Handle revoked sessions (clear cookies)
 *
 * @returns The authenticated user ID, or null if not authenticated
 */
export async function getAuthenticatedStudentId(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  // Verify JWT and extract session_id
  const tokenResult = await verifyToken(accessToken);
  if (!tokenResult) {
    // Invalid or expired JWT - clear cookies
    return null;
  }

  const { sessionId } = tokenResult;

  // Get fingerprint from cookie
  const fingerprint = await getFingerprintFromCookies();
  if (!fingerprint) {
    // Missing fingerprint - clear cookies
    return null;
  }

  // Verify session in database
  const sessionResult = await verifySession(sessionId, fingerprint);
  if (!sessionResult) {
    // Session invalid, revoked, or fingerprint mismatch
    // Cookies should be cleared by the caller if needed
    return null;
  }

  return sessionResult.userId;
}

/**
 * Validates authentication and returns an error response if not authenticated.
 * Use this in API routes that require authentication.
 *
 * @returns An object with either { studentId: string } or { error: NextResponse }
 */
export async function requireAuth(): Promise<
  { studentId: string } | { error: NextResponse }
> {
  const studentId = await getAuthenticatedStudentId();

  if (!studentId) {
    // Clear authentication cookies on authentication failure
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
    clearAuthCookies(response);
    return { error: response };
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
): Promise<{ studentId: string } | { error: NextResponse }> {
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

/**
 * Clears authentication cookies (access_token and fingerprint).
 * Used when authentication fails or session is revoked.
 *
 * @param response - The NextResponse object to set cookies on
 */
export function clearAuthCookies(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  response.cookies.set("fingerprint", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });
}
