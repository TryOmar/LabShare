import { createClient } from "@/lib/supabase/server";

/**
 * Cleans up expired auth codes from the database.
 * Deletes codes that are expired and older than the cleanup threshold.
 *
 * This should be run periodically (e.g., via cron job or scheduled task)
 * to prevent unbounded table growth.
 *
 * @param cleanupHours - Number of hours after which expired codes are deleted (default: 24)
 * @returns Number of codes deleted
 */
export async function cleanupExpiredAuthCodes(
  cleanupHours: number = 24
): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  
  // Calculate cutoff timestamp
  const cutoffTimestamp = new Date(
    now.getTime() - cleanupHours * 60 * 60 * 1000
  ).toISOString();

  // Delete expired codes older than cutoff
  const { error: expiredError, count: expiredCount } = await supabase
    .from("auth_codes")
    .delete()
    .lt("expires_at", cutoffTimestamp);

  if (expiredError) {
    console.error("Error cleaning up expired auth codes:", expiredError);
    throw new Error("Failed to cleanup expired auth codes");
  }

  const totalDeleted = expiredCount || 0;
  
  if (totalDeleted > 0) {
    console.log(`Cleaned up ${totalDeleted} expired auth codes`);
  }

  return totalDeleted;
}

