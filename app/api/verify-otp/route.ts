import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth/sessions";
import { signToken } from "@/lib/auth/jwt";
import { generateFingerprint } from "@/lib/auth/fingerprint";
import { runLazyCleanup } from "@/lib/auth/cleanup";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get student ID (case-insensitive)
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, email")
      .ilike("email", email)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Get the most recent code for this student
    // Only get codes created in the last 15 minutes to avoid matching old codes
    // Use UTC explicitly
    const nowUTC = new Date();
    const fifteenMinutesAgoUTC = new Date(
      nowUTC.getTime() - 15 * 60000
    ).toISOString();

    const { data: authCodes, error: queryError } = await supabase
      .from("auth_codes")
      .select("*")
      .eq("code", code)
      .eq("student_id", student.id)
      .gte("created_at", fifteenMinutesAgoUTC)
      .order("created_at", { ascending: false })
      .limit(1);

    if (queryError || !authCodes || authCodes.length === 0) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const authCode = authCodes[0];

    // Check expiration - all timestamps in UTC
    // Parse created_at as UTC - ensure it's treated as UTC
    // If the string doesn't end with 'Z', append it to indicate UTC
    let createdAtString = authCode.created_at;
    if (
      !createdAtString.endsWith("Z") &&
      !createdAtString.includes("+") &&
      !createdAtString.includes("-", 10)
    ) {
      createdAtString += "Z"; // Append Z to indicate UTC
    }
    const codeCreatedAtUTC = new Date(createdAtString);
    const currentTimeUTC = new Date(); // JavaScript Date is always UTC internally
    const expirationTimeUTC = new Date(codeCreatedAtUTC.getTime() + 10 * 60000); // 10 minutes after creation

    // Calculate time remaining (all in UTC milliseconds)
    const timeRemaining =
      expirationTimeUTC.getTime() - currentTimeUTC.getTime();
    const codeAgeMinutes = Math.round(
      (currentTimeUTC.getTime() - codeCreatedAtUTC.getTime()) / 60000
    );

    // Never log the actual OTP code for security
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Code verification (UTC):", {
        code: "***REDACTED***",
        codeId: authCode.id,
        codeCreatedAtUTC: codeCreatedAtUTC.toISOString(),
        currentTimeUTC: currentTimeUTC.toISOString(),
        calculatedExpirationUTC: expirationTimeUTC.toISOString(),
        timeRemaining: Math.round(timeRemaining / 1000) + " seconds",
        codeAge: codeAgeMinutes + " minutes",
        isExpired: timeRemaining <= 0,
      });
    }

    // Check if code has expired
    if (timeRemaining <= 0) {
      // Delete expired code immediately
      const { error: deleteError } = await supabase
        .from("auth_codes")
        .delete()
        .eq("id", authCode.id);

      if (deleteError) {
        console.error("Error deleting expired auth code:", deleteError);
      }

      return NextResponse.json(
        {
          error: `Code has expired ${Math.abs(
            Math.round(timeRemaining / 60000)
          )} minute(s) ago. Please request a new code.`,
        },
        { status: 400 }
      );
    }

    // Delete code immediately after successful use (before creating session to ensure cleanup)
    const { error: deleteError } = await supabase
      .from("auth_codes")
      .delete()
      .eq("id", authCode.id);

    if (deleteError) {
      console.error("Error deleting auth code after use:", deleteError);
      // Continue anyway - code was used successfully, but log the error
    }

    // Generate device fingerprint from user agent
    const userAgent = request.headers.get("user-agent") || "";
    const fingerprint = await generateFingerprint(userAgent);

    // Create session in database
    const sessionId = await createSession(authCode.student_id, fingerprint);

    // Sign JWT with session_id
    const accessToken = await signToken(sessionId);

    // Create response with student info
    const response = NextResponse.json({
      success: true,
      studentId: authCode.student_id,
      studentEmail: student.email,
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Set JWT access token cookie (httpOnly for security)
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days (matches JWT expiration)
      path: "/",
    });

    // Set fingerprint cookie (httpOnly for security)
    response.cookies.set("fingerprint", fingerprint, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days (matches JWT expiration)
      path: "/",
    });

    // Run lazy cleanup in the background (non-blocking)
    // This helps keep the database clean without impacting user experience
    runLazyCleanup().catch((error) => {
      console.error("Background cleanup error:", error);
      // Silently fail - cleanup shouldn't affect login
    });

    return response;
  } catch (error) {
    // Log error without exposing sensitive details
    console.error(
      "Error in verify-otp:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
