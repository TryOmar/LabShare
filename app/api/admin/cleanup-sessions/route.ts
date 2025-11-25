import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSessions } from "@/lib/auth/sessions";

/**
 * POST /api/admin/cleanup-sessions
 * 
 * Cleans up expired sessions from the database.
 * 
 * NOTE: Consider using /api/cleanup instead, which cleans up both sessions and auth codes.
 * 
 * This endpoint should be called periodically (e.g., via cron job) to prevent
 * unbounded table growth.
 * 
 * Optional query parameters:
 * - jwtExpirationDays: Number of days after which sessions are considered expired (default: 7)
 * 
 * Security: In production, this should be protected with an API key or admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here
    // const authResult = await requireAuth();
    // if ("error" in authResult) {
    //   return authResult.error;
    // }
    // TODO: Add admin check or API key validation

    const { searchParams } = new URL(request.url);
    const jwtExpirationDays = searchParams.get("jwtExpirationDays")
      ? parseInt(searchParams.get("jwtExpirationDays")!, 10)
      : 7;

    const deletedCount = await cleanupExpiredSessions(
      jwtExpirationDays
    );

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} expired sessions`,
    });
  } catch (error) {
    console.error("Error cleaning up sessions:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup sessions",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

