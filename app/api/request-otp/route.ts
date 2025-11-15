import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if student email exists (case-insensitive)
    const { data: student, error: queryError } = await supabase
      .from("students")
      .select("id, email")
      .ilike("email", email)
      .single();

    if (queryError || !student) {
      return NextResponse.json(
        { error: "Email not found in student database" },
        { status: 404 }
      );
    }

    // Invalidate all existing unused codes for this student
    const { data: invalidatedCodes, error: invalidateError } = await supabase
      .from("auth_codes")
      .update({ used: true })
      .eq("student_id", student.id)
      .eq("used", false)
      .select();

    // Invalidate all existing unused codes for this student
    if (process.env.NODE_ENV === "development") {
      console.log("🗑️ Invalidated old codes:", {
        count: invalidatedCodes?.length || 0,
        hasError: !!invalidateError
      });
    }

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Create expiration time: 10 minutes from now in UTC
    // Use Date.UTC to ensure we're working in UTC
    const nowUTC = new Date();
    const expiresAtUTC = new Date(nowUTC.getTime() + 10 * 60000); // 10 minutes from now

    // Format as UTC ISO string explicitly
    const expiresAtISO = expiresAtUTC.toISOString();

    // Never log the actual OTP code for security
    if (process.env.NODE_ENV === "development") {
      console.log("🔐 Generating new OTP (UTC):", {
        code: "***REDACTED***",
        createdAtUTC: nowUTC.toISOString(),
        expiresAtUTC: expiresAtISO,
        expiresIn: "10 minutes"
      });
    }

    // Insert new code with UTC timestamps
    // Explicitly set created_at to UTC to avoid timezone issues
    const createdAtISO = nowUTC.toISOString();
    const { data: newCode, error: insertError } = await supabase
      .from("auth_codes")
      .insert([
        {
          student_id: student.id,
          code: otp,
          expires_at: expiresAtISO, // UTC ISO string
          created_at: createdAtISO, // Explicitly set created_at in UTC
        },
      ])
      .select()
      .single();

    if (insertError || !newCode) {
      console.error("❌ Error inserting auth code:", insertError);
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    // Send email with OTP
    const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LabShare@tryomar.me',
      to: email,
      subject: 'Your Login Code - ITI Share Solutions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Your Login Code</h2>
          <p style="color: #666; font-size: 16px;">Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    // Log success without exposing email or OTP
    if (process.env.NODE_ENV === "development") {
      console.log("✅ OTP email sent successfully");
    }
    return NextResponse.json({ 
      success: true, 
      messageId: emailData?.id,
      codeId: newCode.id,
      createdAt: newCode.created_at
    });
  } catch (error) {
    // Log error without exposing sensitive details
    console.error("Error in request-otp:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

