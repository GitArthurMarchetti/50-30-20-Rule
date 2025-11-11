// Em um novo arquivo: app/api/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, withAuth } from "@/app/lib/auth-helpers";
import { notFoundResponse, internalErrorResponse } from "@/app/lib/errors/responses";


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
    console.error("Error fetching user session data:", error);
    return internalErrorResponse("Failed to fetch user data");
  }
};

export const GET = withAuth(getHandler);