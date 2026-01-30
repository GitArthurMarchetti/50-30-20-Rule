/**
 * Request Security Validator
 * Combines CSRF, Content-Type, and other security validations
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCsrfToken, requiresCsrfProtection } from "./csrf";
import { validateContentType } from "./content-type-validator";
import { handleCorsPreflight, addCorsHeaders } from "./cors";
import { unauthorizedResponse, badRequestResponse } from "../errors/responses";

export interface SecurityValidationResult {
  valid: boolean;
  response?: NextResponse;
}

/**
 * Validate request security (CSRF, Content-Type, CORS)
 * @param request - The incoming request
 * @param options - Validation options
 * @returns Validation result with optional error response
 */
export async function validateRequestSecurity(
  request: NextRequest,
  options: {
    requireCsrf?: boolean;
    requireContentType?: boolean;
    allowedContentTypes?: string[];
  } = {}
): Promise<SecurityValidationResult> {
  const {
    requireCsrf = true,
    requireContentType = true,
    allowedContentTypes = ["application/json"],
  } = options;

  // Handle CORS preflight
  const corsResponse = handleCorsPreflight(request);
  if (corsResponse) {
    return { valid: true, response: corsResponse };
  }

  // Validate Content-Type for state-changing methods
  if (requireContentType) {
    const contentTypeValidation = validateContentType(request, allowedContentTypes);
    if (!contentTypeValidation.valid) {
      return {
        valid: false,
        response: badRequestResponse(contentTypeValidation.error || "Invalid Content-Type"),
      };
    }
  }

  // Validate CSRF token for state-changing methods
  if (requireCsrf && requiresCsrfProtection(request.method)) {
    const csrfValid = await verifyCsrfToken(request);
    if (!csrfValid) {
      return {
        valid: false,
        response: unauthorizedResponse("Invalid or missing CSRF token"),
      };
    }
  }

  return { valid: true };
}

/**
 * Wrapper to add CORS headers to a response
 */
export function secureResponse(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  return addCorsHeaders(response, request);
}
