import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse, notFoundResponse, internalErrorResponse } from "@/app/lib/errors/responses";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { safeParseJson, isValidTransactionType, isValidAmount, parseAndValidateDate, isCategoryTypeCompatible } from "@/app/lib/validators";
import { TransactionType } from "@/app/generated/prisma";

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

    const newTransaction = await prisma.transaction.create({
      data: {
        description,
        amount,
        type: transactionType,
        categoryId: categoryId,
        date: transactionDate,
        userId: session.userId,
      },
    });

    await getOrCreateMonthlySummary(session.userId, transactionDate);

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return internalErrorResponse("Failed to create transaction");
  }
};

export const POST = withAuth(postHandler);