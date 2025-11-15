import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/submission/[id]/files?versionId=xxx
 * Returns files for a specific version of a submission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { id: submissionId } = await params;
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json(
        { error: "versionId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get files for the specified version
    const { data: filesData, error: filesError } = await supabase
      .from("submission_files")
      .select("*")
      .eq("version_id", versionId);

    if (filesError) {
      console.error("Error fetching files:", filesError);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      files: filesData || [],
    });
  } catch (error) {
    console.error("Error in submission files API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

