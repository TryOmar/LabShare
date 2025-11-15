import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Logs out the user by clearing authentication cookies.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear authentication cookies
  response.cookies.set("studentId", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  response.cookies.set("studentEmail", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}

