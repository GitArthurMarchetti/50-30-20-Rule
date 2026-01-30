/**
 * CSRF Token Endpoint
 * Returns the CSRF token for the current session
 * This endpoint is public and should be called by the frontend to get the token
 */

import { NextResponse } from "next/server";
import { getCsrfToken } from "@/app/lib/security/csrf";
import { addCorsHeaders } from "@/app/lib/security/cors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getCsrfToken();
    
    const response = NextResponse.json({ csrfToken: token });
    
    // Add CORS headers
    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}
