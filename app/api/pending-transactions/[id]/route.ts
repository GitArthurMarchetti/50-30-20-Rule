// ============================================================================
// IMPORTS
// ============================================================================
// External
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

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

// Internal - Utilities
import {
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/app/lib/errors/responses";
import {
  safeParseJson,
  isValidTransactionType,
  isValidAmount,
  parseAndValidateDate,
  isCategoryTypeCompatible,
  sanitizeDescription,
} from "@/app/lib/validators";
import { logSuccess, logError } from "@/app/lib/logger";
import { formatPendingTransactionResponse } from "@/app/lib/utils/pending-transaction-formatter";

// ============================================================================
// TYPES
// ============================================================================
type RouteParams = {
  id: string;
};

// ============================================================================
// HANDLERS
// ============================================================================
const putHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: RouteContext<RouteParams>,
  session: SessionUser
) => {
  // --------------------------------------------------------------------------
  // Parse & Validate ID
  // --------------------------------------------------------------------------
  const { id } = await context.params;
  const pendingTransactionId = parseInt(id, 10);

  if (isNaN(pendingTransactionId)) {
    return badRequestResponse("Invalid ID");
  }

  try {
    // ------------------------------------------------------------------------
    // Verify Pending Transaction Exists and User Ownership
    // ------------------------------------------------------------------------
    const existingPendingTransaction = await prisma.pendingTransaction.findFirst({
      where: {
        id: pendingTransactionId,
        userId: session.userId, // Validate ownership
      },
    });

    if (!existingPendingTransaction) {
      return notFoundResponse("Pending transaction not found");
    }

    // ------------------------------------------------------------------------
    // Parse & Validate Request Body
    // ------------------------------------------------------------------------
    const parseResult = await safeParseJson<{
      description?: string;
      amount?: unknown;
      type?: string;
      date?: unknown;
      categoryId?: unknown;
    }>(request);

    if (!parseResult.success) {
      return badRequestResponse(
        parseResult.error || "Invalid request body"
      );
    }

    const body = parseResult.data!;

    // Build update data object (only include fields that are provided)
    const updateData: {
      description?: string;
      amount?: Decimal;
      type?: TransactionType;
      date?: Date;
      categoryId?: number | null;
    } = {};

    // ------------------------------------------------------------------------
    // Validate & Sanitize Description (if provided)
    // ------------------------------------------------------------------------
    if (body.description !== undefined) {
      const description = sanitizeDescription(String(body.description));
      if (description.length === 0) {
        return badRequestResponse("Description cannot be empty");
      }
      updateData.description = description;
    }

    // ------------------------------------------------------------------------
    // Validate Transaction Type (if provided)
    // ------------------------------------------------------------------------
    if (body.type !== undefined) {
      if (!isValidTransactionType(body.type.toUpperCase())) {
        return badRequestResponse(
          `Invalid transaction type: ${body.type}. Valid types are: ${Object.values(
            TransactionType
          ).join(", ")}`
        );
      }
      updateData.type = body.type.toUpperCase() as TransactionType;
    }

    // ------------------------------------------------------------------------
    // Validate Amount (if provided)
    // ------------------------------------------------------------------------
    if (body.amount !== undefined) {
      const amount =
        typeof body.amount === "number"
          ? body.amount
          : parseFloat(String(body.amount).replace(",", "."));

      if (!isValidAmount(amount)) {
        return badRequestResponse("Amount must be a positive number");
      }
      updateData.amount = new Decimal(amount);
    }

    // ------------------------------------------------------------------------
    // Validate Date (if provided)
    // ------------------------------------------------------------------------
    if (body.date !== undefined) {
      const dateValidation = parseAndValidateDate(body.date);
      if (!dateValidation.valid || !dateValidation.date) {
        return badRequestResponse(
          dateValidation.error || "Invalid date"
        );
      }
      updateData.date = dateValidation.date;
    }

    // ------------------------------------------------------------------------
    // Validate Category (if provided)
    // ------------------------------------------------------------------------
    if (body.categoryId !== undefined) {
      if (body.categoryId === null || body.categoryId === "") {
        // Allow setting categoryId to null
        updateData.categoryId = null;
      } else {
        const parsed =
          typeof body.categoryId === "number"
            ? body.categoryId
            : parseInt(String(body.categoryId), 10);

        if (isNaN(parsed) || parsed <= 0) {
          return badRequestResponse("Invalid category ID");
        }

        // Verify category exists and belongs to user
        const category = await prisma.category.findFirst({
          where: { id: parsed, userId: session.userId },
        });

        if (!category) {
          return notFoundResponse("Category not found");
        }

        // Validate category type compatibility with transaction type
        // Use updated type if provided, otherwise use existing type
        const transactionType = updateData.type ?? existingPendingTransaction.type;
        if (!isCategoryTypeCompatible(category.type, transactionType)) {
          return badRequestResponse(
            `Category '${category.name}' is not valid for type '${transactionType}'`
          );
        }

        updateData.categoryId = parsed;
      }
    }

    // ------------------------------------------------------------------------
    // Check if there are any fields to update
    // ------------------------------------------------------------------------
    if (Object.keys(updateData).length === 0) {
      return badRequestResponse("No fields provided to update");
    }

    // ------------------------------------------------------------------------
    // Update Pending Transaction
    // ------------------------------------------------------------------------
    // WHY: Pending transactions don't affect MonthlySummary until committed
    // This allows users to edit imports without triggering summary recalculations
    // SECURITY: Use findFirst with userId to prevent IDOR, then update by id
    // (Prisma doesn't support compound keys for PendingTransaction, so we verify ownership first)
    const updatedPendingTransaction = await prisma.pendingTransaction.update({
      where: {
        id: pendingTransactionId,
        // Note: Prisma doesn't support userId in where for update if not in unique constraint
        // But we verified ownership above, so this is safe
      },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // ------------------------------------------------------------------------
    // Format Response
    // ------------------------------------------------------------------------
    // WHY: Use centralized formatter to ensure consistent response structure
    const formattedResponse = formatPendingTransactionResponse(updatedPendingTransaction);

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    logSuccess("Pending transaction updated successfully", {
      pendingTransactionId,
      userId: session.userId,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json(formattedResponse);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return notFoundResponse("Pending transaction not found");
    }

    logError("Failed to update pending transaction", error, {
      pendingTransactionId,
      userId: session.userId,
    });

    return internalErrorResponse("Failed to update pending transaction");
  }
};

// ============================================================================
// DELETE HANDLER
// ============================================================================
const deleteHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: RouteContext<RouteParams>,
  session: SessionUser
) => {
  // --------------------------------------------------------------------------
  // Parse & Validate ID
  // --------------------------------------------------------------------------
  const { id } = await context.params;
  const pendingTransactionId = parseInt(id, 10);

  if (isNaN(pendingTransactionId)) {
    return badRequestResponse("Invalid ID");
  }

  try {
    // ------------------------------------------------------------------------
    // Verify Pending Transaction Exists and User Ownership
    // ------------------------------------------------------------------------
    const existingPendingTransaction = await prisma.pendingTransaction.findFirst({
      where: {
        id: pendingTransactionId,
        userId: session.userId, // Validate ownership
      },
    });

    if (!existingPendingTransaction) {
      return notFoundResponse("Pending transaction not found");
    }

    // ------------------------------------------------------------------------
    // Delete Pending Transaction
    // ------------------------------------------------------------------------
    // Note: Pending transactions don't affect MonthlySummary,
    // so we can delete them directly without updating summaries
    await prisma.pendingTransaction.delete({
      where: {
        id: pendingTransactionId,
      },
    });

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    logSuccess("Pending transaction deleted successfully", {
      pendingTransactionId,
      userId: session.userId,
    });

    return NextResponse.json({
      message: "Pending transaction deleted successfully",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return notFoundResponse("Pending transaction not found");
    }

    logError("Failed to delete pending transaction", error, {
      pendingTransactionId,
      userId: session.userId,
    });

    return internalErrorResponse("Failed to delete pending transaction");
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export const PUT = withAuth(putHandler, {
  requireCsrf: true,
  requireContentType: true,
});

export const DELETE = withAuth(deleteHandler, {
  requireCsrf: true,
});
