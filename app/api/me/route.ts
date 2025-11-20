// Em um novo arquivo: app/api/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, withAuth } from "@/app/lib/auth-helpers";
import { notFoundResponse, internalErrorResponse } from "@/app/lib/errors/responses";
import { logError } from "@/app/lib/logger";


const getHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context,
  session: SessionUser 
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        username: true, 
        email: true,
      },
    });

    if (!user) {
      return notFoundResponse("User not found");
    }

    return NextResponse.json(user);

  } catch (error) {
    logError("Failed to fetch user session data", error, { userId: session.userId });
    return internalErrorResponse("Failed to fetch user data");
  }
};

export const GET = withAuth(getHandler);