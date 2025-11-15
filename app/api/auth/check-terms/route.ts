import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/auth/check-terms
 * Checks if the user has accepted the terms
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }

    // Check if terms are accepted
    const termsAccepted = request.cookies.get("termsAccepted")?.value === "true";

    return NextResponse.json({
      termsAccepted,
    });
  } catch (error) {
    console.error("Error checking terms:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

