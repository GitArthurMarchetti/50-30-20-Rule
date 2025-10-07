import { getSessionUser } from "@/app/lib/auth-server";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * @method POST
 * @route /api/transactions
 * @description Cria uma nova transação.
 */
export async function POST(request: NextRequest) {
  try {
      const session = await getSessionUser();
      if (!session) {
          return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
      }

      const body = await request.json();

      if (!body.description || body.amount == null || !body.type || !body.date) {
          return NextResponse.json({ message: "Dados da transação incompletos" }, { status: 400 });
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
      console.error("Erro ao criar transação:", error);
      return NextResponse.json({ message: "Ocorreu um erro no servidor." }, { status: 500 });
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
        { message: "Não autorizado" },
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
    console.error("Erro ao buscar transações:", error);
    return NextResponse.json(
      { message: "Ocorreu um erro no servidor." },
      { status: 500 }
    );
  }
}