import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse, conflictResponse, internalErrorResponse } from "@/app/lib/errors/responses";
import { prisma } from "@/prisma/db";
import { TransactionType } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { safeParseJson, isValidTransactionType, isValidCategoryName } from "@/app/lib/validators";

const getHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  const where: { userId: number; type?: TransactionType } = {
    userId: session.userId,
  };

  if (typeParam) {
    if (!isValidTransactionType(typeParam.toUpperCase())) {
      return badRequestResponse(`Invalid transaction type: ${typeParam}. Valid types are: ${Object.values(TransactionType).join(", ")}`);
    }
    where.type = typeParam.toUpperCase() as TransactionType;
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
};

const postHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  const parseResult = await safeParseJson<{ name?: unknown; type?: string }>(request);
  if (!parseResult.success) {
    return badRequestResponse(parseResult.error || "Invalid request body");
  }

  const body = parseResult.data!;

  if (!body.name || !body.type) {
    return badRequestResponse("Name and type are required");
  }

  const nameValidation = isValidCategoryName(body.name);
  if (!nameValidation.valid) {
    return badRequestResponse(nameValidation.error || "Invalid category name");
  }
  const categoryName = String(body.name).trim();

  if (!isValidTransactionType(body.type.toUpperCase())) {
    return badRequestResponse(`Invalid transaction type: ${body.type}. Valid types are: ${Object.values(TransactionType).join(", ")}`);
  }
  const validType = body.type.toUpperCase() as TransactionType;

  try {
    const category = await prisma.category.create({
      data: {
        name: categoryName,
        type: validType,
        userId: session.userId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return conflictResponse(
        `Category '${categoryName}' already exists for type '${validType}'`
      );
    }
    console.error("Error creating category:", error);
    return internalErrorResponse("Failed to create category");
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

