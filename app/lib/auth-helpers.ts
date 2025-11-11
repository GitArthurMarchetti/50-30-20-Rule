import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SessionUser } from "./auth-server";
import { internalErrorResponse, unauthorizedResponse } from "./errors/responses";


export type RouteContext<TParams> = {
  params: Promise<TParams>;
};

export type AuthenticatedHandler<TParams> = (
  req: NextRequest,
  context: RouteContext<TParams>,
  session: SessionUser
) => Promise<NextResponse>;

export function withAuth<TParams extends Record<string, unknown>>(
  handler: AuthenticatedHandler<TParams>
) {
  return async (req: NextRequest, context: RouteContext<TParams>) => {
    try {
      const session = await getSessionUser();
      if (!session) {
        return unauthorizedResponse();
      }

      return await handler(req, context, session);
      
    } catch (error) {
      console.error("Erro na rota protegida:", error);
      return internalErrorResponse();
    }
  };
}