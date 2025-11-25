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
    throw new Error("Failed to create session");
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

  // Get session from database
  const { data: session, error } = await supabase
    .from("sessions")
    .select("user_id, fingerprint, revoked")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return null;
  }

  // Check if session is revoked
  if (session.revoked) {
    return null;
  }

  // Check fingerprint match
  if (session.fingerprint !== fingerprint) {
    // Fingerprint mismatch - possible token theft
    // Revoke the session immediately
    await supabase
      .from("sessions")
      .update({ revoked: true })
      .eq("id", sessionId);

    return null;
  }

  // Update last_seen timestamp
  await supabase
    .from("sessions")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", sessionId);

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
