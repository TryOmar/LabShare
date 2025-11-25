import { cleanupExpiredSessions } from "./sessions";
import { cleanupExpiredAuthCodes } from "./auth-codes";

// In-memory cache to track last cleanup time (resets on server restart)
// This prevents cleanup from running too frequently
let lastCleanupTime: number | null = null;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run cleanup at most once per hour

/**
 * Runs cleanup for both sessions and auth codes if enough time has passed.
 * This is a lazy cleanup that runs occasionally to prevent unbounded growth.
 * 
 * @param force - If true, runs cleanup regardless of last cleanup time
 * @returns Object with cleanup results
 */
export async function runLazyCleanup(force: boolean = false): Promise<{
  sessionsDeleted: number;
  authCodesDeleted: number;
  skipped: boolean;
}> {
  const now = Date.now();
  
  // Skip if cleanup ran recently (unless forced)
  if (!force && lastCleanupTime !== null && (now - lastCleanupTime) < CLEANUP_INTERVAL_MS) {
    return {
      sessionsDeleted: 0,
      authCodesDeleted: 0,
      skipped: true,
    };
  }

  try {
    // Run both cleanups in parallel
    const [sessionsDeleted, authCodesDeleted] = await Promise.all([
      cleanupExpiredSessions(),
      cleanupExpiredAuthCodes(),
    ]);

    lastCleanupTime = now;

    return {
      sessionsDeleted,
      authCodesDeleted,
      skipped: false,
    };
  } catch (error) {
    console.error("Error in lazy cleanup:", error);
    // Don't throw - cleanup failures shouldn't break the app
    return {
      sessionsDeleted: 0,
      authCodesDeleted: 0,
      skipped: false,
    };
  }
}

/**
 * Runs cleanup immediately without throttling.
 * Use this for manual cleanup or external cron jobs.
 * 
 * @returns Object with cleanup results
 */
export async function runCleanup(): Promise<{
  sessionsDeleted: number;
  authCodesDeleted: number;
}> {
  const [sessionsDeleted, authCodesDeleted] = await Promise.all([
    cleanupExpiredSessions(),
    cleanupExpiredAuthCodes(),
  ]);

  return {
    sessionsDeleted,
    authCodesDeleted,
  };
}

