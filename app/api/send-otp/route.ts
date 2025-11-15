import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    console.log("🚀 /api/send-otp route called");
  }
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    // Note: In Next.js, environment variables are loaded at build/start time
    // Make sure to restart the dev server after adding/changing .env.local
    const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing from environment variables");
      return NextResponse.json(
        { error: "Email service not configured. Please add RESEND_API_KEY to your .env.local file and restart the server" },
        { status: 500 }
      );
    }

    // Initialize Resend with API key
    const resend = new Resend(RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
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

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    // Log success without exposing email or OTP
    if (process.env.NODE_ENV === "development") {
      console.log("✅ OTP email sent successfully");
    }
    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    // Log error without exposing sensitive details
    console.error("Error sending OTP email:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

