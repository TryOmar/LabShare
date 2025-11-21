import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tracks
 * Returns all available tracks.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, code, name")
      .order("code");

    if (error) {
      console.error("Error fetching tracks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tracks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tracks: tracks || [],
    });
  } catch (error) {
    console.error("Error in tracks API:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

