import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SessionUser } from "./auth-server";
import { internalErrorResponse, unauthorizedResponse } from "./errors/responses";
import { logError } from "./logger";
import { validateRequestSecurity, secureResponse } from "./security/request-validator";


export type RouteContext<TParams> = {
  params: Promise<TParams>;
};

export type AuthenticatedHandler<TParams> = (
  req: NextRequest,
  context: RouteContext<TParams>,
  session: SessionUser
) => Promise<NextResponse>;

export interface AuthOptions {
  requireCsrf?: boolean;
  requireContentType?: boolean;
  allowedContentTypes?: string[];
}

export function withAuth<TParams extends Record<string, unknown>>(
  handler: AuthenticatedHandler<TParams>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest, context: RouteContext<TParams>) => {
    let session: SessionUser | null = null;
    
    try {
      // Validate security (CSRF, Content-Type, CORS)
      const securityValidation = await validateRequestSecurity(req, {
        requireCsrf: options.requireCsrf ?? true,
        requireContentType: options.requireContentType ?? true,
        allowedContentTypes: options.allowedContentTypes,
      });

      if (!securityValidation.valid && securityValidation.response) {
        return securityValidation.response;
      }

      // If security validation returned a response (e.g., CORS preflight), return it
      if (securityValidation.response) {
        return securityValidation.response;
      }

      // Check authentication
      session = await getSessionUser();
      if (!session) {
        return unauthorizedResponse();
      }

      // Execute handler
      const response = await handler(req, context, session);
      
      // Add CORS headers to response
      return secureResponse(response, req);
      
    } catch (error) {
      // Log error com contexto adicional
      const url = req.url ? new URL(req.url).pathname : 'unknown';
      logError("Error in protected route", error, { 
        path: url,
        method: req.method,
        userId: session?.userId 
      });
      return internalErrorResponse();
    }
  };
}