import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revokeSession } from "@/lib/auth/sessions";
import { clearAuthCookies } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Logs out the user by revoking the session and clearing authentication cookies.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract JWT from cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    // If we have a token, extract session_id and revoke the session
    if (accessToken) {
      const tokenResult = await verifyToken(accessToken);
      if (tokenResult) {
        // Revoke the session in the database
        await revokeSession(tokenResult.sessionId);
      }
    }

    // Clear authentication cookies
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);

    return response;
  } catch (error) {
    // Even if revocation fails, clear cookies and return success
    // This ensures the user is logged out client-side
    console.error("Error during logout:", error);
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}
