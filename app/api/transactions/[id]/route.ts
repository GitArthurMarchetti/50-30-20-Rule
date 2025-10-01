import { getSessionUser } from "@/app/lib/auth-server";
import { prisma } from "@/prisma/db";
import { NextResponse } from "next/server";

// Lida com a criação de uma nova transação (POST)
export async function POST(request: Request) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();

        // Validação básica dos dados recebidos
        if (!body.description || body.amount == null || !body.type || !body.date) {
            return NextResponse.json({ message: "Dados da transação incompletos" }, { status: 400 });
        }

        const newTransaction = await prisma.transaction.create({
            data: {
                description: body.description,
                amount: body.amount,
                type: body.type,
                // CORREÇÃO: Adicionando a data recebida do front-end
                date: new Date(body.date), 
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

// Lida com a listagem de transações (GET) - sem alterações
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const transactionId = parseInt(params.id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ message: "ID de transação inválido" }, { status: 400 });
    }

    // Verificação de segurança: A transação existe E pertence ao usuário logado?
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.userId,
      },
    });

    if (!transaction) {
      return NextResponse.json({ message: "Transação não encontrada ou não pertence ao usuário" }, { status: 404 });
    }

    // Se tudo estiver certo, deleta a transação
    await prisma.transaction.delete({
      where: {
        id: transactionId,
      },
    });

    return NextResponse.json({ message: "Transação deletada com sucesso" }, { status: 200 });

  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

