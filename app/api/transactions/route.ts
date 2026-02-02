import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse, notFoundResponse, internalErrorResponse } from "@/app/lib/errors/responses";
import { updateMonthlySummaryIncrementalWithTx } from "@/app/lib/services/summary-service";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { safeParseJson, isValidTransactionType, isValidAmount, parseAndValidateDate, isCategoryTypeCompatible, sanitizeDescription } from "@/app/lib/validators";
import { TransactionType } from "@/app/generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { logSuccess, logError } from "@/app/lib/logger";

const postHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  try {
    const parseResult = await safeParseJson<{
      description?: string;
      amount?: unknown;
      type?: string;
      date?: unknown;
      categoryId?: unknown;
    }>(request);
    if (!parseResult.success) {
      return badRequestResponse(parseResult.error || "Invalid request body");
    }

    const body = parseResult.data!;

    if (!body.description || body.amount == null || !body.type || !body.date) {
      return badRequestResponse("Incomplete transaction data: description, amount, type, and date are required");
    }

    // Sanitize description to prevent XSS
    const description = sanitizeDescription(String(body.description));
    if (description.length === 0) {
      return badRequestResponse("Description cannot be empty");
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

    let categoryId: number | null = null;
    if (body.categoryId != null) {
      const parsed = typeof body.categoryId === "number" ? body.categoryId : parseInt(String(body.categoryId), 10);
      if (isNaN(parsed) || parsed <= 0) {
        return badRequestResponse("Invalid category ID");
      }
      categoryId = parsed;
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: session.userId }
      });
      if (!category) {
        return notFoundResponse("Category not found");
      }
      if (!isCategoryTypeCompatible(category.type, transactionType)) {
        return badRequestResponse(`Category '${category.name}' is not valid for type '${transactionType}'`);
      }
    }

    // CRÍTICO: Usar transação atômica para garantir consistência
    // Se a criação da transação ou atualização do summary falhar, tudo é revertido
    const newTransaction = await prisma.$transaction(async (tx) => {
      // Criar transação
      const transaction = await tx.transaction.create({
        data: {
          description,
          amount,
          type: transactionType,
          categoryId: categoryId,
          date: transactionDate,
          userId: session.userId,
        },
      });

      // Atualizar summary dentro da mesma transação
      // Importar função que aceita transação como parâmetro
      await updateMonthlySummaryIncrementalWithTx(
        tx,
        session.userId,
        transactionDate,
        {
          type: transactionType,
          newAmount: new Decimal(amount),
        }
      );

      return transaction;
    });

    logSuccess("Transaction created successfully", { 
      transactionId: newTransaction.id, 
      userId: session.userId, 
      type: transactionType,
      amount: amount 
    });
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    logError("Failed to create transaction", error, { userId: session.userId });
    return internalErrorResponse("Failed to create transaction");
  }
};

export const POST = withAuth(postHandler, {
  requireCsrf: true,
  requireContentType: true,
});