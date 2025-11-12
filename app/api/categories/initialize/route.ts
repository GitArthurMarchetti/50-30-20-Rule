import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { internalErrorResponse } from "@/app/lib/errors/responses";
import { NextRequest, NextResponse } from "next/server";
import { initializeDefaultCategories } from "@/app/lib/category-helpers";
import { prisma } from "@/prisma/db";

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

    return NextResponse.json(
      {
        message: "Default categories initialized",
        categoriesCreated,
        existingCategories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initializing default categories:", error);
    return internalErrorResponse("Failed to initialize default categories");
  }
};

export const POST = withAuth(postHandler);

