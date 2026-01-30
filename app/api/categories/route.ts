// ============================================================================
// IMPORTS
// ============================================================================
// External
import { NextRequest, NextResponse } from "next/server";

// Internal - Types
import { TransactionType } from "@/app/generated/prisma";
import { SessionUser } from "@/app/lib/auth-server";
import {
  AuthenticatedHandler,
  RouteContext,
  withAuth,
} from "@/app/lib/auth-helpers";

// Internal - Services
import { prisma } from "@/prisma/db";
import { initializeDefaultCategories } from "@/app/lib/category-helpers";

// Internal - Utilities
import {
  badRequestResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/app/lib/errors/responses";
import {
  safeParseJson,
  isValidTransactionType,
  isValidCategoryName,
} from "@/app/lib/validators";
import { logWarning, logError, logSuccess } from "@/app/lib/logger";

// ============================================================================
// HANDLERS
// ============================================================================
const getHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  // --------------------------------------------------------------------------
  // Parse Query Parameters
  // --------------------------------------------------------------------------
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  // --------------------------------------------------------------------------
  // Build Where Clause
  // --------------------------------------------------------------------------
  const where: { userId: number; type?: TransactionType } = {
    userId: session.userId,
  };

  if (typeParam) {
    if (!isValidTransactionType(typeParam.toUpperCase())) {
      return badRequestResponse(
        `Invalid transaction type: ${typeParam}. Valid types are: ${Object.values(
          TransactionType
        ).join(", ")}`
      );
    }
    where.type = typeParam.toUpperCase() as TransactionType;
  }

  // --------------------------------------------------------------------------
  // Fetch Categories
  // --------------------------------------------------------------------------
  const categories = await prisma.category.findMany({
    where,
    select: {
      id: true,
      name: true,
      type: true,
    },
    orderBy: { name: "asc" },
  });

  // --------------------------------------------------------------------------
  // Auto-initialize Default Categories (if none exist)
  // --------------------------------------------------------------------------
  if (categories.length === 0) {
    try {
      await initializeDefaultCategories(session.userId);

      // Refetch after initialization
      const newCategories = await prisma.category.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json(newCategories);
    } catch (error) {
      logWarning("Failed to auto-initialize default categories", {
        userId: session.userId,
      });
      logError("Error auto-initializing default categories", error, {
        userId: session.userId,
      });
      // Return empty array if initialization fails
    }
  }

  return NextResponse.json(categories);
};

const postHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  try {
    // ------------------------------------------------------------------------
    // Parse & Validate Request Body
    // ------------------------------------------------------------------------
    const parseResult = await safeParseJson<{
      name?: unknown;
      type?: string;
    }>(request);

    if (!parseResult.success) {
      return badRequestResponse(
        parseResult.error || "Invalid request body"
      );
    }

    const body = parseResult.data!;

    // Required fields validation
    if (!body.name || !body.type) {
      return badRequestResponse("Name and type are required");
    }

    // ------------------------------------------------------------------------
    // Validate Category Name
    // ------------------------------------------------------------------------
    const nameValidation = isValidCategoryName(body.name);
    if (!nameValidation.valid) {
      return badRequestResponse(
        nameValidation.error || "Invalid category name"
      );
    }
    const categoryName = String(body.name).trim();

    // ------------------------------------------------------------------------
    // Validate Transaction Type
    // ------------------------------------------------------------------------
    if (!isValidTransactionType(body.type.toUpperCase())) {
      return badRequestResponse(
        `Invalid transaction type: ${body.type}. Valid types are: ${Object.values(
          TransactionType
        ).join(", ")}`
      );
    }
    const validType = body.type.toUpperCase() as TransactionType;

    // ------------------------------------------------------------------------
    // Create Category
    // ------------------------------------------------------------------------
    const category = await prisma.category.create({
      data: {
        name: categoryName,
        type: validType,
        userId: session.userId,
      },
    });

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    logSuccess("Category created successfully", {
      categoryId: category.id,
      userId: session.userId,
      name: categoryName,
      type: validType,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return conflictResponse(
        `Category '${String(body.name).trim()}' already exists for type '${body.type.toUpperCase()}'`
      );
    }

    logError("Failed to create category", error, {
      userId: session.userId,
    });

    return internalErrorResponse("Failed to create category");
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

