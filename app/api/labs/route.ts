import { NextRequest, NextResponse } from "next/server";
import { getLabsAction } from "./action";

/**
 * GET /api/labs
 * Returns labs data for the authenticated student (courses and labs).
 */
export async function GET(request: NextRequest) {
  const result = await getLabsAction();

  if (result && "error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 500 }
    );
  }

  return NextResponse.json(result);
}
