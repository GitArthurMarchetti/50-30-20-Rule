/**
 * CORS Configuration
 * Provides explicit CORS handling for API routes
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

const DEFAULT_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-CSRF-Token",
  "X-Requested-With",
];

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
      return true;
    }
  }

  // Check against allowed origins
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const method = request.headers.get("access-control-request-method");

  if (request.method !== "OPTIONS") {
    return null;
  }

  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 204 });

  response.headers.set("Access-Control-Allow-Origin", origin!);
  response.headers.set("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS.join(", "));
  response.headers.set(
    "Access-Control-Allow-Headers",
    DEFAULT_ALLOWED_HEADERS.join(", ")
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get("origin");

  if (isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Expose-Headers",
      "X-CSRF-Token"
    );
  }

  return response;
}
