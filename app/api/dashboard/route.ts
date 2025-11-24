import { NextRequest, NextResponse } from "next/server";
import { getDashboardAction } from "./action";

/**
 * GET /api/dashboard
 * Returns dashboard data for the authenticated student.
 * This replaces client-side queries with server-side validation.
 */
export async function GET(request: NextRequest) {
  const result = await getDashboardAction();

  if (result && "error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 500 }
    );
  }

  return NextResponse.json(result);
}
