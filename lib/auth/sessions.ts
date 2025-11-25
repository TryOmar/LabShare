import { createClient } from "@/lib/supabase/server";

/**
 * Creates a new session in the database for a user.
 * Each session is bound to a device fingerprint.
 *
 * @param userId - The user ID (student ID)
 * @param fingerprint - The device fingerprint
 * @returns The session ID (UUID)
 */
export async function createSession(
  userId: string,
  fingerprint: string
): Promise<string> {
  const supabase = await createClient();
  // Use global crypto which works in both Node.js and Edge Runtime
  const sessionId = crypto.randomUUID();

  const { error } = await supabase.from("sessions").insert({
    id: sessionId,
    user_id: userId,
    fingerprint: fingerprint,
    last_seen: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creating session:", error);
    // Include error code and sanitized message if available
    const code = error.code ? ` [${error.code}]` : "";
    const msg = error.message ? ` ${error.message}` : "";
    throw new Error(`Failed to create session.${code}${msg}`);
  }

  return sessionId;
}

/**
 * Verifies a session by checking:
 * 1. Session exists
 * 2. Fingerprint matches
 * 3. Updates last_seen timestamp
 *
 * If fingerprint mismatch is detected, the session is automatically deleted.
 * Uses atomic operations to prevent race conditions.
 *
 * @param sessionId - The session ID to verify
 * @param fingerprint - The device fingerprint to match
 * @returns An object with userId if valid, null otherwise
 */
export async function verifySession(
  sessionId: string,
  fingerprint: string
): Promise<{ userId: string } | null> {
  const supabase = await createClient();

  // Atomic check: Query session with all validation conditions in a single query
  // This prevents race conditions
  const { data: session, error } = await supabase
    .from("sessions")
    .select("user_id, fingerprint")
    .eq("id", sessionId)
    .eq("fingerprint", fingerprint)
    .single();

  if (error || !session) {
    // Session not found or fingerprint mismatch
    // Check if session exists with different fingerprint (possible token theft)
    // If mismatch detected, delete the session immediately
    const { data: mismatchSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .neq("fingerprint", fingerprint)
      .single();

    if (mismatchSession) {
      // Fingerprint mismatch detected - delete the session immediately
      await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);
    }

    return null;
  }

  // Update last_seen timestamp (best-effort; log errors but do not throw)
  const { error: lastSeenError } = await supabase
    .from("sessions")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", sessionId);

  if (lastSeenError) {
    console.error("Error updating last_seen for session:", sessionId, lastSeenError);
  }

  return { userId: session.user_id };
}

/**
 * Deletes a session from the database.
 *
 * @param sessionId - The session ID to delete
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete session");
  }
}

/**
 * Deletes all sessions for a user.
 * Useful for logout from all devices or security events.
 *
 * @param userId - The user ID (student ID)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting user sessions:", error);
    throw new Error("Failed to delete user sessions");
  }
}

/**
 * Cleans up expired sessions from the database.
 * Deletes sessions older than the JWT expiration time.
 *
 * This should be run periodically (e.g., via cron job or scheduled task)
 * to prevent unbounded table growth.
 *
 * @param jwtExpirationDays - Number of days after which sessions are considered expired (default: 7)
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(
  jwtExpirationDays: number = 7
): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  
  // Calculate cutoff date
  const expiredCutoff = new Date(
    now.getTime() - jwtExpirationDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // Delete expired sessions (older than JWT expiration)
  const { error: expiredError, count: expiredCount } = await supabase
    .from("sessions")
    .delete()
    .lt("created_at", expiredCutoff);

  if (expiredError) {
    console.error("Error cleaning up expired sessions:", expiredError);
    throw new Error("Failed to cleanup expired sessions");
  }

  const totalDeleted = expiredCount || 0;
  
  if (totalDeleted > 0) {
    console.log(`Cleaned up ${totalDeleted} expired sessions`);
  }

  return totalDeleted;
}
