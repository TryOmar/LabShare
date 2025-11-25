import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * Generates a device fingerprint by hashing the user agent and a random UUID.
 * This creates a unique identifier for each device that persists across sessions.
 * Uses Web Crypto API which works in both Node.js and Edge Runtime.
 *
 * @param userAgent - The User-Agent header from the request
 * @returns A hashed fingerprint string
 */
export async function generateFingerprint(userAgent: string): Promise<string> {
  // Use global crypto which works in both Node.js and Edge Runtime
  const randomId = crypto.randomUUID();
  const combined = `${userAgent}:${randomId}`;

  // Use Web Crypto API for hashing (works in Edge Runtime)
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * Extracts the fingerprint from the request cookies.
 * The fingerprint is stored in a cookie set during login.
 *
 * @param request - The Next.js request object
 * @returns The fingerprint string, or null if not found
 */
export async function extractFingerprint(
  request: NextRequest
): Promise<string | null> {
  const fingerprint = request.cookies.get("fingerprint")?.value;
  return fingerprint || null;
}

/**
 * Extracts the fingerprint from cookies (server-side, no request object).
 * Used in server components and API routes that don't have access to NextRequest.
 *
 * @returns The fingerprint string, or null if not found
 */
export async function getFingerprintFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const fingerprint = cookieStore.get("fingerprint")?.value;
  return fingerprint || null;
}
