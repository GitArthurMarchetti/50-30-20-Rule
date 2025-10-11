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

      const newTransaction = await prisma.transaction.create({
          data: {
              description: body.description,
              amount: body.amount,
              type: body.type,
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

/**
 * @method GET
 * @route /api/transactions
 * @description Lista todas as transações do usuário.
 */
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