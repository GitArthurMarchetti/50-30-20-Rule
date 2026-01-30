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
import {
  updateMonthlySummaryIncremental,
  updateMonthlySummaryIncrementalWithTx,
} from "@/app/lib/services/summary-service";

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

// ============================================================================
// TYPES
// ============================================================================
type RouteParams = {
  id: string;
};

// ============================================================================
// HANDLERS
// ============================================================================
const getHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: RouteContext<RouteParams>,
  session: SessionUser
) => {
  // --------------------------------------------------------------------------
  // Parse & Validate ID
  // --------------------------------------------------------------------------
  const { id } = await context.params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return badRequestResponse("Invalid ID");
  }

  // --------------------------------------------------------------------------
  // Fetch Transaction
  // --------------------------------------------------------------------------
  const transaction = await prisma.transaction.findUnique({
    where: {
      id_userId: {
        id: transactionId,
        userId: session.userId,
      },
    },
  });

  if (!transaction) {
    return notFoundResponse("Transaction not found");
  }

  return NextResponse.json(transaction);
};

const deleteHandler: AuthenticatedHandler<RouteParams> = async (
  req,
  context,
  session
) => {
  // --------------------------------------------------------------------------
  // Parse & Validate ID
  // --------------------------------------------------------------------------
  const { id } = await context.params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return badRequestResponse("Invalid ID");
  }

  try {
    // ------------------------------------------------------------------------
    // Fetch Transaction (needed for summary update)
    // ------------------------------------------------------------------------
    const transactionToDelete = await prisma.transaction.findUnique({
      where: {
        id_userId: {
          id: transactionId,
          userId: session.userId,
        },
      },
    });

    if (!transactionToDelete) {
      return notFoundResponse("Transaction not found");
    }

    // ------------------------------------------------------------------------
    // Delete Transaction (Atomic Operation)
    // ------------------------------------------------------------------------
    await prisma.$transaction(async (tx) => {
      // Delete transaction
      await tx.transaction.delete({
        where: {
          id_userId: {
            id: transactionId,
            userId: session.userId,
          },
        },
      });

      // Update summary within same transaction
      await updateMonthlySummaryIncrementalWithTx(
        tx,
        session.userId,
        transactionToDelete.date,
        {
          type: transactionToDelete.type,
          oldAmount: transactionToDelete.amount,
        }
      );
    });

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    logSuccess("Transaction deleted successfully", {
      transactionId: transactionId,
      userId: session.userId,
    });

    return NextResponse.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return notFoundResponse("Transaction not found");
    }

    logError("Failed to delete transaction", error, {
      transactionId,
      userId: session.userId,
    });

    return internalErrorResponse("Failed to delete transaction");
  }
};

const putHandler: AuthenticatedHandler<RouteParams> = async (
  req,
  context,
  session
) => {
  // --------------------------------------------------------------------------
  // Parse & Validate ID
  // --------------------------------------------------------------------------
  const { id } = await context.params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return badRequestResponse("Invalid ID");
  }

  try {
    // ------------------------------------------------------------------------
    // Verify Transaction Exists
    // ------------------------------------------------------------------------
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id_userId: {
          id: transactionId,
          userId: session.userId,
        },
      },
    });

    if (!existingTransaction) {
      return notFoundResponse("Transaction not found");
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
    }>(req);

    if (!parseResult.success) {
      return badRequestResponse(
        parseResult.error || "Invalid request body"
      );
    }

    const body = parseResult.data!;

    // Required fields validation
    if (
      !body.description ||
      body.amount == null ||
      !body.type ||
      !body.date
    ) {
      return badRequestResponse(
        "Missing required fields: description, amount, type, and date are required"
      );
    }

    // ------------------------------------------------------------------------
    // Sanitize & Validate Description
    // ------------------------------------------------------------------------
    const description = sanitizeDescription(String(body.description));
    if (description.length === 0) {
      return badRequestResponse("Description cannot be empty");
    }

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
    const transactionType = body.type.toUpperCase() as TransactionType;

    // ------------------------------------------------------------------------
    // Validate Amount
    // ------------------------------------------------------------------------
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : parseFloat(String(body.amount));

    if (!isValidAmount(amount)) {
      return badRequestResponse("Amount must be a positive number");
    }

    // ------------------------------------------------------------------------
    // Validate Date
    // ------------------------------------------------------------------------
    const dateValidation = parseAndValidateDate(body.date);
    if (!dateValidation.valid || !dateValidation.date) {
      return badRequestResponse(
        dateValidation.error || "Invalid date"
      );
    }
    const transactionDate = dateValidation.date;

    // ------------------------------------------------------------------------
    // Validate Category (if provided)
    // ------------------------------------------------------------------------
    let parsedCategoryId: number | null = null;
    if (body.categoryId != null) {
      const parsed =
        typeof body.categoryId === "number"
          ? body.categoryId
          : parseInt(String(body.categoryId), 10);

      if (isNaN(parsed) || parsed <= 0) {
        return badRequestResponse("Invalid category ID");
      }
      parsedCategoryId = parsed;
    }

    if (parsedCategoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsedCategoryId, userId: session.userId },
      });

      if (!category) {
        return notFoundResponse("Category not found");
      }

      if (!isCategoryTypeCompatible(category.type, transactionType)) {
        return badRequestResponse(
          `Category '${category.name}' is not valid for type '${transactionType}'`
        );
      }
    }

    // CRÍTICO: Usar transação atômica para garantir consistência
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // Atualizar transação
      const transaction = await tx.transaction.update({
        where: {
          id_userId: {
            id: transactionId,
            userId: session.userId,
          },
        },
        data: {
          description,
          amount,
          type: transactionType,
          date: transactionDate,
          categoryId: parsedCategoryId,
        },
      });

      // OTIMIZAÇÃO: Atualização incremental O(1) em vez de recalcular tudo O(n)
      // Se o mês mudou, atualiza ambos os meses
      const oldMonth = existingTransaction.date;
      const newMonth = transaction.date;
      const monthChanged = 
        oldMonth.getFullYear() !== newMonth.getFullYear() ||
        oldMonth.getMonth() !== newMonth.getMonth();
      
      const typeChanged = existingTransaction.type !== transactionType;

      if (monthChanged) {
        // Remove do mês antigo (tipo antigo)
        await updateMonthlySummaryIncrementalWithTx(
          tx,
          session.userId,
          oldMonth,
          {
            type: existingTransaction.type,
            oldAmount: existingTransaction.amount,
          }
        );
        // Adiciona ao mês novo (tipo novo)
        await updateMonthlySummaryIncrementalWithTx(
          tx,
          session.userId,
          newMonth,
          {
            type: transactionType,
            newAmount: new Decimal(amount),
          }
        );
      } else if (typeChanged) {
        // Mesmo mês, mas tipo mudou - remove do tipo antigo e adiciona ao tipo novo
        await updateMonthlySummaryIncrementalWithTx(
          tx,
          session.userId,
          transactionDate,
          {
            type: existingTransaction.type,
            oldAmount: existingTransaction.amount, // Remove do tipo antigo
          }
        );
        await updateMonthlySummaryIncrementalWithTx(
          tx,
          session.userId,
          transactionDate,
          {
            type: transactionType,
            newAmount: new Decimal(amount), // Adiciona ao tipo novo
          }
        );
      } else {
        // Mesmo mês, mesmo tipo - apenas atualiza diferença de valor
        await updateMonthlySummaryIncrementalWithTx(
          tx,
          session.userId,
          transactionDate,
          {
            type: transactionType,
            oldAmount: existingTransaction.amount, // Remove valor antigo
            newAmount: new Decimal(amount), // Adiciona valor novo
          }
        );
      }

      return transaction;
    });

    logSuccess("Transaction updated successfully", { 
      transactionId: transactionId, 
      userId: session.userId,
      type: transactionType,
      amount: amount
    });
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return notFoundResponse("Transaction not found");
    }
    logError("Failed to update transaction", error, { transactionId, userId: session.userId });
    return internalErrorResponse("Failed to update transaction");
  }
};

export const GET = withAuth(getHandler, {
  requireCsrf: false, // GET doesn't need CSRF
  requireContentType: false,
});

export const DELETE = withAuth(deleteHandler, {
  requireCsrf: true,
  requireContentType: false, // DELETE typically doesn't have body
});

export const PUT = withAuth(putHandler, {
  requireCsrf: true,
  requireContentType: true,
});