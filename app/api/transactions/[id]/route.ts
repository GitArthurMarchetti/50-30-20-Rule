import { getSessionUser } from "@/app/lib/auth-server";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { message: "An error occurred on the server." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.transaction.delete({
      where: {
        id: transactionId,
      },
    });

    return NextResponse.json(
      { message: "Transaction deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Error deleting transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const transactionId = parseInt(params.id, 10);
    if (isNaN(transactionId)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    // 1. Pega os novos dados do body
    const body = await request.json();
    const { description, amount, date, categoryId } = body;

    // 2. Validação simples (pode melhorar)
    if (!description || !amount || !date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id_userId: {
          id: transactionId,
          userId: session.userId,
        },
      },
      data: {
        description: String(description),
        amount: parseFloat(amount),
        date: new Date(date),
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
      },
    });

    await getOrCreateMonthlySummary(session.userId, updatedTransaction.date);

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(`Error updating transaction ${params.id}:`, error);
    return NextResponse.json(
      { message: "Internal error" },
      { status: 500 }
    );
  }
}