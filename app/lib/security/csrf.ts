/**
 * CSRF Protection
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { logWarning } from "@/app/lib/logger";

const CSRF_TOKEN_COOKIE = "csrf-token";
const CSRF_TOKEN_HEADER = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a secure random CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Get or create CSRF token for the current session
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  if (!token) {
    token = generateCsrfToken();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: false, // Must be accessible to JavaScript for Double Submit Cookie pattern
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return token;
}

/**
 * Verify CSRF token from request header against cookie
 * @param request - The incoming request
 * @returns true if token is valid, false otherwise
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (!headerToken) {
    logWarning('CSRF token validation failed: missing header token', {
      endpoint: new URL(request.url).pathname,
      method: request.method,
    });
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  if (!cookieToken) {
    logWarning('CSRF token validation failed: missing cookie token', {
      endpoint: new URL(request.url).pathname,
      method: request.method,
    });
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  const isValid = constantTimeEquals(headerToken, cookieToken);
  
  if (!isValid) {
    logWarning('CSRF token validation failed: token mismatch', {
      endpoint: new URL(request.url).pathname,
      method: request.method,
    });
  }
  
  return isValid;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Check if a request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  // Only protect state-changing methods
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}
