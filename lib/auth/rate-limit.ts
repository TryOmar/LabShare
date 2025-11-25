/**
 * Rate limiting for OTP requests.
 * Prevents abuse by limiting the number of OTP requests per user.
 * 
 * Uses the auth_codes table to track recent requests (works with Vercel serverless).
 */

import { createClient } from "@/lib/supabase/server";

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until next request is allowed
  message?: string;
}

/**
 * Checks if a user can request a new OTP code.
 * 
 * Rate limit: Maximum 3 requests per 10 minutes per user.
 * 
 * @param studentId - The student ID to check
 * @param maxRequests - Maximum number of requests allowed (default: 3)
 * @param windowMinutes - Time window in minutes (default: 10)
 * @returns Rate limit check result
 */
export async function checkOTPRateLimit(
  studentId: string,
  maxRequests: number = 3,
  windowMinutes: number = 10
): Promise<RateLimitResult> {
  const supabase = await createClient();
  
  // Calculate cutoff time (windowMinutes ago)
  const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  // Count OTP requests in the last windowMinutes
  // Count all codes (used or unused) to track request frequency
  const { count, error } = await supabase
    .from("auth_codes")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .gte("created_at", cutoffTime);
  
  if (error) {
    console.error("Error checking rate limit:", error);
    // On error, allow the request (fail open) to avoid blocking legitimate users
    return { allowed: true };
  }
  
  const requestCount = count || 0;
  
  if (requestCount >= maxRequests) {
    // Find the oldest request in the window to calculate retry time
    const { data: oldestRequest } = await supabase
      .from("auth_codes")
      .select("created_at")
      .eq("student_id", studentId)
      .gte("created_at", cutoffTime)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (oldestRequest) {
      const oldestTime = new Date(oldestRequest.created_at).getTime();
      const retryAfter = Math.ceil(
        (oldestTime + windowMinutes * 60 * 1000 - Date.now()) / 1000
      );
      
      return {
        allowed: false,
        retryAfter: Math.max(0, retryAfter),
        message: `Too many requests. Please wait ${Math.ceil(retryAfter / 60)} minute(s) before requesting a new code.`,
      };
    }
    
    return {
      allowed: false,
      retryAfter: windowMinutes * 60,
      message: `Too many requests. Please wait ${windowMinutes} minute(s) before requesting a new code.`,
    };
  }
  
  return { allowed: true };
}

