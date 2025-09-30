// app/api/transactions/route.ts

import { getSessionUser } from "@/app/lib/auth-server";
import { prisma } from "@/prisma/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Obter a sessão do usuário logado
    const session = await getSessionUser();

    // Se não houver sessão (usuário não logado), retorne um erro de não autorizado
    if (!session) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    // 2. Usar o ID do usuário para filtrar a busca no banco de dados
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.userId, // AQUI ESTÁ A MÁGICA!
      },
      orderBy: {
        date: "desc", // Opcional: ordenar as transações
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

export async function POST(request: Request) {
    try {
        const session = await getSessionUser();

        if (!session) {
            return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();

        const newTransaction = await prisma.transaction.create({
            data: {
                description: body.description,
                amount: body.amount,
                type: body.type,
                userId: session.userId,
            },
        });

        return NextResponse.json(newTransaction, { status: 201 });

    } catch (error) {
        console.error("Erro ao criar transação:", error);
        return NextResponse.json(
            { message: "Ocorreu um erro no servidor." },
            { status: 500 }
        );
    }
}