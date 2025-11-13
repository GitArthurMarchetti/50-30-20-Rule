// app/api/transactions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import { updateMonthlySummaryIncremental } from "@/app/lib/services/summary-service";
import { SessionUser } from "@/app/lib/auth-server";
import { Decimal } from "@prisma/client/runtime/library"; 

import {
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/app/lib/errors/responses"; 
import { AuthenticatedHandler, withAuth } from "@/app/lib/auth-helpers";
import { safeParseJson, isValidTransactionType, isValidAmount, parseAndValidateDate, isCategoryTypeCompatible } from "@/app/lib/validators";
import { TransactionType } from "@/app/generated/prisma";

type RouteParams = {
  id: string;
};

// -----------------------------------------------------------------------------
// GET Handler (Lógica de Negócio Pura)
// -----------------------------------------------------------------------------
const getHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,

  context: { params: Promise<{ id: string }> },
  session: SessionUser 
) => {

  const { id } = await context.params; 
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return badRequestResponse("Invalid ID");
  }

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

// -----------------------------------------------------------------------------
// DELETE Handler (Lógica de Negócio Pura)
// -----------------------------------------------------------------------------
const deleteHandler: AuthenticatedHandler<RouteParams> = async (
  req,
  context,
  session
) => {
  const { id } = await context.params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return badRequestResponse("Invalid ID");
  }

  try {
    // Busca a transação antes de deletar para atualizar o summary
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

    await prisma.transaction.delete({
      where: {
        id_userId: {
          id: transactionId,
          userId: session.userId,
        },
      },
    });

    // OTIMIZAÇÃO: Atualização incremental O(1) em vez de recalcular tudo O(n)
    await updateMonthlySummaryIncremental(
      session.userId,
      transactionToDelete.date,
      {
        type: transactionToDelete.type,
        oldAmount: transactionToDelete.amount, // Remove valor da transação deletada
      }
    );

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return notFoundResponse("Transaction not found");
    }
    console.error("Error deleting transaction:", error);
    return internalErrorResponse("Failed to delete transaction");
  }
};

// -----------------------------------------------------------------------------
// PUT Handler (Lógica de Negócio Pura)
// -----------------------------------------------------------------------------
const putHandler: AuthenticatedHandler<RouteParams> = async (
  req,
  context,
  session
) => {
  const { id } = await context.params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return badRequestResponse("Invalid ID");
  }

  try {
    // First verify the transaction exists and belongs to the user
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

    const parseResult = await safeParseJson<{
      description?: string;
      amount?: unknown;
      type?: string;
      date?: unknown;
      categoryId?: unknown;
    }>(req);
    if (!parseResult.success) {
      return badRequestResponse(parseResult.error || "Invalid request body");
    }

    const body = parseResult.data!;

    if (!body.description || body.amount == null || !body.type || !body.date) {
      return badRequestResponse("Missing required fields: description, amount, type, and date are required");
    }

    const description = String(body.description).trim();
    if (description.length === 0) {
      return badRequestResponse("Description cannot be empty");
    }
    if (description.length > 255) {
      return badRequestResponse("Description cannot exceed 255 characters");
    }

    if (!isValidTransactionType(body.type.toUpperCase())) {
      return badRequestResponse(`Invalid transaction type: ${body.type}. Valid types are: ${Object.values(TransactionType).join(", ")}`);
    }
    const transactionType = body.type.toUpperCase() as TransactionType;

    const amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount));
    if (!isValidAmount(amount)) {
      return badRequestResponse("Amount must be a positive number");
    }

    const dateValidation = parseAndValidateDate(body.date);
    if (!dateValidation.valid || !dateValidation.date) {
      return badRequestResponse(dateValidation.error || "Invalid date");
    }
    const transactionDate = dateValidation.date;

    let parsedCategoryId: number | null = null;
    if (body.categoryId != null) {
      const parsed = typeof body.categoryId === "number" ? body.categoryId : parseInt(String(body.categoryId), 10);
      if (isNaN(parsed) || parsed <= 0) {
        return badRequestResponse("Invalid category ID");
      }
      parsedCategoryId = parsed;
    }

    if (parsedCategoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsedCategoryId, userId: session.userId }
      });
      if (!category) {
        return notFoundResponse("Category not found");
      }
      if (!isCategoryTypeCompatible(category.type, transactionType)) {
        return badRequestResponse(`Category '${category.name}' is not valid for type '${transactionType}'`);
      }
    }

    const updatedTransaction = await prisma.transaction.update({
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
    const newMonth = updatedTransaction.date;
    const monthChanged = 
      oldMonth.getFullYear() !== newMonth.getFullYear() ||
      oldMonth.getMonth() !== newMonth.getMonth();
    
    const typeChanged = existingTransaction.type !== transactionType;

    if (monthChanged) {
      // Remove do mês antigo (tipo antigo)
      await updateMonthlySummaryIncremental(
        session.userId,
        oldMonth,
        {
          type: existingTransaction.type,
          oldAmount: existingTransaction.amount,
        }
      );
      // Adiciona ao mês novo (tipo novo)
      await updateMonthlySummaryIncremental(
        session.userId,
        newMonth,
        {
          type: transactionType,
          newAmount: new Decimal(amount),
        }
      );
    } else if (typeChanged) {
      // Mesmo mês, mas tipo mudou - remove do tipo antigo e adiciona ao tipo novo
      await updateMonthlySummaryIncremental(
        session.userId,
        transactionDate,
        {
          type: existingTransaction.type,
          oldAmount: existingTransaction.amount, // Remove do tipo antigo
        }
      );
      await updateMonthlySummaryIncremental(
        session.userId,
        transactionDate,
        {
          type: transactionType,
          newAmount: new Decimal(amount), // Adiciona ao tipo novo
        }
      );
    } else {
      // Mesmo mês, mesmo tipo - apenas atualiza diferença de valor
      await updateMonthlySummaryIncremental(
        session.userId,
        transactionDate,
        {
          type: transactionType,
          oldAmount: existingTransaction.amount, // Remove valor antigo
          newAmount: new Decimal(amount), // Adiciona valor novo
        }
      );
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return notFoundResponse("Transaction not found");
    }
    console.error("Error updating transaction:", error);
    return internalErrorResponse("Failed to update transaction");
  }
};

export const GET = withAuth(getHandler);
export const DELETE = withAuth(deleteHandler);
export const PUT = withAuth(putHandler);