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

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Create expiration time: 10 minutes from now in UTC
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

    // Use the database function to atomically upsert the OTP code
    // This function uses advisory locks to prevent race conditions when multiple
    // requests come in simultaneously for the same user
    const { error: upsertError } = await supabase.rpc("upsert_otp_code", {
      p_student_id: student.id,
      p_code: otp,
      p_expires_at: expiresAtISO,
    });

    if (upsertError) {
      console.error("❌ Error upserting auth code:", upsertError);
      // Check if it's a unique constraint violation (shouldn't happen with the function, but handle it)
      if (upsertError.code === "23505" || upsertError.message?.includes("duplicate key")) {
        // Race condition occurred - retry once after a short delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        const { error: retryError } = await supabase.rpc("upsert_otp_code", {
          p_student_id: student.id,
          p_code: otp,
          p_expires_at: expiresAtISO,
        });
        if (retryError) {
          console.error("❌ Error on retry:", retryError);
          return NextResponse.json(
            { error: "Failed to generate code. Please try again." },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Failed to generate code" },
          { status: 500 }
        );
      }
    }

    // Fetch the newly created code to return its ID
    const { data: newCode, error: fetchError } = await supabase
      .from("auth_codes")
      .select("id, created_at")
      .eq("student_id", student.id)
      .eq("code", otp)
      .eq("used", false)
      .single();

    if (fetchError) {
      console.error("❌ Error fetching new auth code:", fetchError);
      // Code was created but we couldn't fetch it - still proceed with email
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
      subject: 'Your Login Code - Lab Sharing',
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
      codeId: newCode?.id,
      createdAt: newCode?.created_at
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

