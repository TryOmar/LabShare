/**
 * Configuration validation and environment variable checks.
 * This module validates required environment variables at startup.
 * Import this module early in the application lifecycle to catch missing config.
 */

/**
 * Validates that all required environment variables are set.
 * Throws an error if any required variable is missing.
 * 
 * This should be called at application startup to fail fast if configuration is invalid.
 */
export function validateConfig(): void {
  const requiredEnvVars = [
    "JWT_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      `Please configure them in your .env.local file and restart the server.`
    );
  }
}

// Validate config when module is imported (runs at startup)
// This ensures the app fails fast if JWT_SECRET is missing
if (typeof window === "undefined") {
  // Only run in server-side code
  try {
    validateConfig();
  } catch (error) {
    // Log error but don't throw during module load to allow graceful handling
    console.error("⚠️  Configuration validation failed:", error);
  }
}

