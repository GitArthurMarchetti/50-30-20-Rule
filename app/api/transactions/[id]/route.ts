// app/api/transactions/[id]/route.ts

import { getSessionUser } from "@/app/lib/auth-server";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

// -----------------------------------------------------------------------------
// GET (Já estava Correto)
// -----------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Assinatura Correta
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // Correto, com 'await'
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
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
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { message: "An error occurred on the server." },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// DELETE (Corrigido)
// -----------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👇 Assinatura Corrigida
) {
  let id: string; // Movido para fora para uso no log de erro
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // 👇 Corrigido: 'await' adicionado para obter os params
    const params = await context.params;
    id = params.id;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.transaction.delete({
      where: {
        id_userId: {
          id: transactionId,
          userId: session.userId,
        },
      },
    });

    return NextResponse.json(
      { message: "Transaction deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting transaction unknown`, error);
    return NextResponse.json(
      { error: "Error deleting transaction" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// PUT (Corrigido)
// -----------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👇 Assinatura Corrigida
) {
  let id: string; // Movido para fora para uso no log de erro
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 👇 Corrigido: 'await' adicionado para obter os params
    const params = await context.params;
    id = params.id;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { description, amount, date, categoryId } = body;

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
    console.error(`Error updating transaction unknown`, error);
    return NextResponse.json(
      { message: "Internal error" },
      { status: 500 }
    );
  }
}