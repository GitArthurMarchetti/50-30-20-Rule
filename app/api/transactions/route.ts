import { getSessionUser } from "@/app/lib/auth-server";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.description || body.amount == null || !body.type || !body.date) {
      return NextResponse.json({ message: "Incomplete transaction data" }, { status: 400 });
    }

    const transactionDate = new Date(body.date);
    const categoryId = body.categoryId ? parseInt(body.categoryId, 10) : null;

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: session.userId }
      });
      if (!category) {
        return NextResponse.json({ message: "Category not found" }, { status: 404 });
      }
      if (category.type !== body.type) {
        return NextResponse.json(
          { message: `Category '${category.name}' is not valid for type '${body.type}'` },
          { status: 400 }
        );
      }
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        description: body.description,
        amount: body.amount,
        type: body.type,
        categoryId: categoryId,
        date: transactionDate,
        userId: session.userId,
      },
    });

    await getOrCreateMonthlySummary(session.userId, transactionDate);

    return NextResponse.json(newTransaction, { status: 201 });

  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ message: "An error occurred on the server." }, { status: 500 });
  }
}