import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse, notFoundResponse, conflictResponse, internalErrorResponse } from "@/app/lib/errors/responses";
import { prisma } from "@/prisma/db";
import { TransactionType } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { safeParseJson, isValidTransactionType, isValidCategoryName } from "@/app/lib/validators";
import { logSuccess, logError } from "@/app/lib/logger";

type RouteParams = {
  id: string;
};

const getHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session: SessionUser
) => {
  const { id } = await context.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return badRequestResponse("Invalid category ID");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: session.userId,
    },
  });

  if (!category) {
    return notFoundResponse("Category not found");
  }

  return NextResponse.json(category);
};

const putHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session: SessionUser
) => {
  const { id } = await context.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return badRequestResponse("Invalid category ID");
  }

  const parseResult = await safeParseJson<{ name?: unknown; type?: string }>(request);
  if (!parseResult.success) {
    return badRequestResponse(parseResult.error || "Invalid request body");
  }

  const body = parseResult.data!;

  if (!body.name && !body.type) {
    return badRequestResponse("At least name or type must be provided");
  }

  const updateData: { name?: string; type?: TransactionType } = {};

  if (body.name) {
    const nameValidation = isValidCategoryName(body.name);
    if (!nameValidation.valid) {
      return badRequestResponse(nameValidation.error || "Invalid category name");
    }
    updateData.name = String(body.name).trim();
  }

  if (body.type) {
    if (!isValidTransactionType(body.type.toUpperCase())) {
      return badRequestResponse(`Invalid transaction type: ${body.type}. Valid types are: ${Object.values(TransactionType).join(", ")}`);
    }
    updateData.type = body.type.toUpperCase() as TransactionType;
  }

  // First verify the category exists and belongs to the user
  const existingCategory = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: session.userId,
    },
  });

  if (!existingCategory) {
    return notFoundResponse("Category not found");
  }

  // CRITICAL: If changing category type, check if there are transactions using this category
  // Changing type would make existing transactions incompatible
  if (updateData.type && updateData.type !== existingCategory.type) {
    const transactionsCount = await prisma.transaction.count({
      where: {
        categoryId: categoryId,
        userId: session.userId,
      },
    });

    if (transactionsCount > 0) {
      return badRequestResponse(
        `Cannot change category type. ${transactionsCount} transaction(s) are using this category. ` +
        `Please update or remove those transactions first, or delete the category and create a new one.`
      );
    }
  }

  // Check for duplicate category with the final name and type (after update)
  // This handles all cases: name only, type only, or both name and type
  const finalName = updateData.name || existingCategory.name;
  const finalType = updateData.type || existingCategory.type;
  
  // Only check for duplicates if name or type is actually changing
  if (updateData.name || updateData.type) {
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        userId: session.userId,
        name: finalName,
        type: finalType,
        NOT: {
          id: categoryId, // Exclude the current category
        },
      },
    });

    if (duplicateCategory) {
      return conflictResponse(
        `Category '${finalName}' already exists for type '${finalType}'`
      );
    }
  }

  try {
    const category = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: updateData,
    });

    logSuccess("Category updated successfully", { 
      categoryId: categoryId, 
      userId: session.userId,
      name: category.name,
      type: category.type
    });
    return NextResponse.json(category);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2025") {
        return notFoundResponse("Category not found");
      }
      if (error.code === "P2002") {
        // This should not happen due to our check above, but handle it just in case
        return conflictResponse(
          `Category '${updateData.name || existingCategory.name}' already exists for this type`
        );
      }
    }
    logError("Failed to update category", error, { categoryId, userId: session.userId });
    return internalErrorResponse("Failed to update category");
  }
};

const deleteHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session: SessionUser
) => {
  const { id } = await context.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return badRequestResponse("Invalid category ID");
  }

  // First verify the category exists and belongs to the user
  const existingCategory = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId: session.userId,
    },
  });

  if (!existingCategory) {
    return notFoundResponse("Category not found");
  }

  try {
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    logSuccess("Category deleted successfully", { 
      categoryId: categoryId, 
      userId: session.userId 
    });
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return notFoundResponse("Category not found");
    }
    logError("Failed to delete category", error, { categoryId, userId: session.userId });
    return internalErrorResponse("Failed to delete category");
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);

