import { NextRequest, NextResponse } from "next/server";
import { runCleanup } from "@/lib/auth/cleanup";

/**
 * POST /api/cleanup
 * 
 * Cleans up expired sessions and auth codes.
 * 
 * This endpoint can be called by:
 * - External cron services (cron-job.org, EasyCron, etc.)
 * - Manual triggers
 * - Other automated systems
 * 
 * Optional query parameters:
 * - jwtExpirationDays: Number of days for session expiration (default: 7)
 * - authCodeCleanupHours: Number of hours for auth code cleanup (default: 24)
 * 
 * Security: Consider adding API key authentication for production use.
 * Example: Add ?apiKey=YOUR_SECRET_KEY and validate it
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key validation
    // const apiKey = request.headers.get("x-api-key");
    // if (apiKey !== process.env.CLEANUP_API_KEY) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const result = await runCleanup();

    return NextResponse.json({
      success: true,
      ...result,
      message: `Cleaned up ${result.sessionsDeleted} expired sessions and ${result.authCodesDeleted} expired auth codes`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cleanup API:", error);
    return NextResponse.json(
      {
        error: "Failed to run cleanup",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cleanup
 * 
 * Health check endpoint - returns cleanup status without running cleanup.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Cleanup endpoint is available",
    endpoints: {
      POST: "Run cleanup (for cron jobs)",
      GET: "Health check",
    },
    usage: "Call POST /api/cleanup to trigger cleanup. Can be used with external cron services.",
  });
}

