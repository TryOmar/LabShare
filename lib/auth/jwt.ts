import { SignJWT, jwtVerify } from "jose";
import { validateConfig } from "@/lib/config";

/**
 * Gets the JWT secret from environment variables.
 * Throws an error if not configured.
 * 
 * Note: validateConfig() should be called at startup to catch this early.
 */
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Validate config on first access if not already validated
    validateConfig();
    // If we get here, JWT_SECRET is still missing (shouldn't happen)
    throw new Error(
      "JWT_SECRET environment variable is not set. Please configure it in your .env.local file."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Parses the JWT expiration time from environment variable.
 * Supports formats like "7d", "1h", "30d", etc.
 * Defaults to "7d" if not set.
 */
function getExpirationTime(): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return expiresIn;
}

/**
 * Signs a JWT token with the session_id in the payload.
 * The token expires based on JWT_EXPIRES_IN environment variable (default: 7d).
 *
 * @param sessionId - The session ID to include in the JWT payload
 * @returns A signed JWT token string
 */
export async function signToken(sessionId: string): Promise<string> {
  const secret = getJWTSecret();
  const expiresIn = getExpirationTime();

  const token = await new SignJWT({ session_id: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return token;
}

/**
 * Verifies a JWT token and extracts the session_id from the payload.
 * Returns null if the token is invalid, expired, or malformed.
 *
 * @param token - The JWT token string to verify
 * @returns An object with sessionId, or null if verification fails
 */
export async function verifyToken(
  token: string
): Promise<{ sessionId: string } | null> {
  try {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret);

    const sessionId = payload.session_id;
    if (typeof sessionId !== "string" || !sessionId) {
      return null;
    }

    return { sessionId };
  } catch (error) {
    // Token is invalid, expired, or malformed
    // Log error details for debugging/monitoring (not exposed to client)
    console.debug("JWT verification failed:", error);
    return null;
  }
}

