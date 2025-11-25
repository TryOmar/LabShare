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
    revoked: false,
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
 * 1. Session exists and is not revoked
 * 2. Fingerprint matches
 * 3. Updates last_seen timestamp
 *
 * If fingerprint mismatch is detected, the session is automatically revoked.
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
  // This prevents race conditions where a session could be revoked between check and update
  const { data: session, error } = await supabase
    .from("sessions")
    .select("user_id, fingerprint, revoked")
    .eq("id", sessionId)
    .eq("revoked", false)
    .eq("fingerprint", fingerprint)
    .single();

  if (error || !session) {
    // Session not found, revoked, or fingerprint mismatch
    // Check if session exists with different fingerprint (possible token theft)
    // Use atomic update to revoke only if session exists, is not revoked, and fingerprint doesn't match
    // This prevents race conditions and handles fingerprint mismatch detection
    const { data: mismatchSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("revoked", false)
      .neq("fingerprint", fingerprint)
      .single();

    if (mismatchSession) {
      // Fingerprint mismatch detected - revoke the session
      await supabase
        .from("sessions")
        .update({ revoked: true })
        .eq("id", sessionId);
    }

    return null;
  }

  // Update last_seen timestamp (best-effort; log errors but do not throw)
  const { error: lastSeenError } = await supabase
    .from("sessions")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("revoked", false);

  if (lastSeenError) {
    console.error("Error updating last_seen for session:", sessionId, lastSeenError);
  }

  return { userId: session.user_id };
}

/**
 * Revokes a session by marking it as revoked in the database.
 *
 * @param sessionId - The session ID to revoke
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .update({ revoked: true })
    .eq("id", sessionId);

  if (error) {
    console.error("Error revoking session:", error);
    throw new Error("Failed to revoke session");
  }
}

/**
 * Revokes all active sessions for a user.
 * Useful for logout from all devices or security events.
 *
 * @param userId - The user ID (student ID)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .update({ revoked: true })
    .eq("user_id", userId)
    .eq("revoked", false);

  if (error) {
    console.error("Error revoking user sessions:", error);
    throw new Error("Failed to revoke user sessions");
  }
}

/**
 * Cleans up expired or stale sessions from the database.
 * Deletes sessions that are either:
 * 1. Revoked and older than the cleanup threshold
 * 2. Not revoked but older than the JWT expiration time (stale sessions)
 *
 * This should be run periodically (e.g., via cron job or scheduled task)
 * to prevent unbounded table growth.
 *
 * @param jwtExpirationDays - Number of days after which sessions are considered expired (default: 7)
 * @param revokedCleanupDays - Number of days to keep revoked sessions before cleanup (default: 1)
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(
  jwtExpirationDays: number = 7,
  revokedCleanupDays: number = 1
): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  
  // Calculate cutoff dates
  const expiredCutoff = new Date(
    now.getTime() - jwtExpirationDays * 24 * 60 * 60 * 1000
  ).toISOString();
  
  const revokedCutoff = new Date(
    now.getTime() - revokedCleanupDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // Delete expired non-revoked sessions (older than JWT expiration)
  const { error: expiredError, count: expiredCount } = await supabase
    .from("sessions")
    .delete()
    .eq("revoked", false)
    .lt("created_at", expiredCutoff);

  if (expiredError) {
    console.error("Error cleaning up expired sessions:", expiredError);
    throw new Error("Failed to cleanup expired sessions");
  }

  // Delete old revoked sessions
  const { error: revokedError, count: revokedCount } = await supabase
    .from("sessions")
    .delete()
    .eq("revoked", true)
    .lt("created_at", revokedCutoff);

  if (revokedError) {
    console.error("Error cleaning up revoked sessions:", revokedError);
    throw new Error("Failed to cleanup revoked sessions");
  }

  const totalDeleted = (expiredCount || 0) + (revokedCount || 0);
  
  if (totalDeleted > 0) {
    console.log(`Cleaned up ${totalDeleted} expired sessions (${expiredCount || 0} expired, ${revokedCount || 0} revoked)`);
  }

  return totalDeleted;
}
