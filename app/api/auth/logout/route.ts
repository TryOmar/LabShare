import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { deleteSession } from "@/lib/auth/sessions";
import { clearAuthCookies } from "@/lib/auth";
import { runLazyCleanup } from "@/lib/auth/cleanup";

/**
 * POST /api/auth/logout
 * Logs out the user by deleting the session and clearing authentication cookies.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract JWT from cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    // If we have a token, extract session_id and delete the session
    if (accessToken) {
      const tokenResult = await verifyToken(accessToken);
      if (tokenResult) {
        // Delete the session from the database
        await deleteSession(tokenResult.sessionId);
      }
    }

    // Clear authentication cookies
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);

    // Run lazy cleanup in the background (non-blocking)
    // This helps keep the database clean without impacting user experience
    runLazyCleanup().catch((error) => {
      console.error("Background cleanup error:", error);
      // Silently fail - cleanup shouldn't affect logout
    });

    return response;
  } catch (error) {
    // Even if deletion fails, clear cookies and return success
    // This ensures the user is logged out client-side
    console.error("Error during logout:", error);
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}
