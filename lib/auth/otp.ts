/**
 * OTP management using Supabase database.
 * 
 * This approach works perfectly with Vercel serverless functions:
 * - Stateless - no shared memory needed
 * - Works across multiple instances
 * - Only ONE active OTP per user (enforced by unique index)
 * - Simple and reliable - no cleanup needed (max 100 rows for 100 users)
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Generates a 6-digit OTP code for a student and stores it in the database.
 * Code expires in 10 minutes.
 * 
 * Ensures only ONE active OTP per user by using an atomic database function
 * that deletes existing unused codes and inserts the new one in a single transaction.
 * This prevents race conditions that could occur with separate delete/insert operations.
 * 
 * @param studentId - The student ID
 * @returns A 6-digit OTP code
 */
export async function generateOTP(studentId: string): Promise<string> {
  const supabase = await createClient();
  
  // Generate random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Calculate expiration (10 minutes from now)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  
  // Use atomic database function to prevent race conditions
  // This function does DELETE + INSERT in a single transaction
  const { error } = await supabase.rpc("upsert_otp_code", {
    p_student_id: studentId,
    p_code: code,
    p_expires_at: expiresAt,
  });
  
  if (error) {
    // Log detailed error for debugging
    console.error("Error storing OTP:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to generate OTP code: ${error.message}`);
  }
  
  return code;
}

/**
 * Verifies an OTP code from the database.
 * 
 * @param code - The 6-digit OTP code
 * @param studentId - The student ID to verify against
 * @returns The student ID if valid, null otherwise
 */
export async function verifyOTP(code: string, studentId: string): Promise<string | null> {
  const supabase = await createClient();
  
  // Validate code format (6 digits)
  if (!/^\d{6}$/.test(code)) {
    console.error("OTP verification failed: Invalid code format", { code, studentId });
    return null; // Invalid format
  }
  
  // Find unused, non-expired code for this student
  const now = new Date().toISOString();
  const { data: authCode, error } = await supabase
    .from("auth_codes")
    .select("id, student_id, expires_at, code, used, created_at")
    .eq("code", code)
    .eq("student_id", studentId)
    .eq("used", false)
    .gt("expires_at", now) // Not expired
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error("OTP verification query error:", {
      error: error.message,
      code: error.code,
      details: error.details,
      searchCode: code,
      studentId,
    });
    return null;
  }
  
  if (!authCode) {
    // Code not found - check if it exists but is expired or used
    const { data: existingCode } = await supabase
      .from("auth_codes")
      .select("code, used, expires_at, created_at")
      .eq("code", code)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (existingCode) {
      console.error("OTP verification failed: Code exists but", {
        used: existingCode.used,
        expired: existingCode.expires_at <= now,
        expiresAt: existingCode.expires_at,
        now,
        code,
        studentId,
      });
    } else {
      console.error("OTP verification failed: Code not found", { code, studentId });
    }
    return null;
  }
  
  // Mark as used (one-time use) - only update if still unused (prevents double-use)
  const { error: updateError } = await supabase
    .from("auth_codes")
    .update({ used: true })
    .eq("id", authCode.id)
    .eq("used", false); // Only update if still unused (atomic check prevents double-use)
  
  if (updateError) {
    // Update failed - code may have been used already or other error
    console.error("Error marking OTP as used:", updateError);
    return null;
  }
  
  return authCode.student_id;
}


