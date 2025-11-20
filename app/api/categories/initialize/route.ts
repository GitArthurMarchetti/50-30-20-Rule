import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { internalErrorResponse } from "@/app/lib/errors/responses";
import { NextRequest, NextResponse } from "next/server";
import { initializeDefaultCategories } from "@/app/lib/category-helpers";
import { prisma } from "@/prisma/db";
import { logSuccess, logError } from "@/app/lib/logger";

const postHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  try {
    // Check if user already has categories
    const existingCategories = await prisma.category.count({
      where: { userId: session.userId },
    });

    // Initialize default categories for the user
    const categoriesCreated = await initializeDefaultCategories(session.userId);

    logSuccess("Default categories initialized", { 
      userId: session.userId, 
      categoriesCreated,
      existingCategories 
    });
    return NextResponse.json(
      {
        message: "Default categories initialized",
        categoriesCreated,
        existingCategories,
      },
      { status: 200 }
    );
  } catch (error) {
    logError("Failed to initialize default categories", error, { userId: session.userId });
    return internalErrorResponse("Failed to initialize default categories");
  }
};

export const POST = withAuth(postHandler);

