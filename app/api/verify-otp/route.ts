import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    // Get the most recent unused code for this student
    // Only get codes created in the last 15 minutes to avoid matching old codes
    // Use UTC explicitly
    const nowUTC = new Date();
    const fifteenMinutesAgoUTC = new Date(nowUTC.getTime() - 15 * 60000).toISOString();
    
    const { data: authCodes, error: queryError } = await supabase
      .from("auth_codes")
      .select("*")
      .eq("code", code)
      .eq("student_id", student.id)
      .eq("used", false)
      .gte("created_at", fifteenMinutesAgoUTC)
      .order("created_at", { ascending: false })
      .limit(1);

    if (queryError || !authCodes || authCodes.length === 0) {
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 400 }
      );
    }

    const authCode = authCodes[0];

    // Check expiration - all timestamps in UTC
    // Parse created_at as UTC - ensure it's treated as UTC
    // If the string doesn't end with 'Z', append it to indicate UTC
    let createdAtString = authCode.created_at;
    if (!createdAtString.endsWith('Z') && !createdAtString.includes('+') && !createdAtString.includes('-', 10)) {
      createdAtString += 'Z'; // Append Z to indicate UTC
    }
    const codeCreatedAtUTC = new Date(createdAtString);
    const currentTimeUTC = new Date(); // JavaScript Date is always UTC internally
    const expirationTimeUTC = new Date(codeCreatedAtUTC.getTime() + 10 * 60000); // 10 minutes after creation
    
    // Calculate time remaining (all in UTC milliseconds)
    const timeRemaining = expirationTimeUTC.getTime() - currentTimeUTC.getTime();
    const codeAgeMinutes = Math.round((currentTimeUTC.getTime() - codeCreatedAtUTC.getTime()) / 60000);
    
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
        isExpired: timeRemaining <= 0
      });
    }
    
    // Check if code has expired
    if (timeRemaining <= 0) {
      // Mark expired code as used
      await supabase
        .from("auth_codes")
        .update({ used: true })
        .eq("id", authCode.id);
      
      return NextResponse.json(
        { error: `Code has expired ${Math.abs(Math.round(timeRemaining / 60000))} minute(s) ago. Please request a new code.` },
        { status: 400 }
      );
    }

    // Mark code as used
    await supabase
      .from("auth_codes")
      .update({ used: true })
      .eq("id", authCode.id);

    // Create response with student info
    const response = NextResponse.json({ 
      success: true,
      studentId: authCode.student_id,
      studentEmail: student.email
    });

    // Set authentication cookie (httpOnly for security)
    // 30 days expiration for persistent login
    response.cookies.set("studentId", authCode.student_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    response.cookies.set("studentEmail", student.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Clear termsAccepted cookie on each login to require terms acceptance
    response.cookies.set("termsAccepted", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    // Log error without exposing sensitive details
    console.error("Error in verify-otp:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

