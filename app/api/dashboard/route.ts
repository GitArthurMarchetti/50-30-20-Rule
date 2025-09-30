// app/api/dashboard/route.ts

import { TransactionType } from "@/app/generated/prisma";
import { getSessionUser } from "@/app/lib/auth-server";
import { prisma } from "@/prisma/db";
import { Decimal } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const userWithTransactions = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        transactions: {
          where: { date: { gte: firstDayOfMonth } },
        },
      },
    });

    if (!userWithTransactions) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    const { transactions, monthly_total_income } = userWithTransactions;
    const plannedIncome = monthly_total_income || new Decimal(0);

    const formatCurrency = (amount: Decimal | number) => {
      return `R$${new Decimal(amount).toFixed(2).replace('.', ',')}`;
    }

    const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
    const actualMonthIncome = incomeTransactions.reduce((acc, t) => acc.add(t.amount), new Decimal(0));

    const calculateCategoryData = (type: TransactionType, targetPercentage: number) => {
      const categoryTransactions = transactions.filter(t => t.type === type);
      const actualAmountSpent = categoryTransactions.reduce((acc, t) => acc.add(t.amount), new Decimal(0));
      const maxAmount = plannedIncome.mul(targetPercentage / 100);
      const actualPercentage = actualMonthIncome.isZero() 
        ? 0 
        : actualAmountSpent.div(actualMonthIncome).mul(100).toNumber();

      return {
        title: type.charAt(0) + type.slice(1).toLowerCase(),
        type: type,
        actualPercentage: `${actualPercentage.toFixed(0)}%`,
        maxPercentage: `${targetPercentage}%`,
        actualAmount: formatCurrency(actualAmountSpent),
        maxAmount: formatCurrency(maxAmount),
        items: categoryTransactions.map(t => ({ id: t.id, description: t.description, amount: t.amount.toNumber() })),
      };
    };

    const financialData = {
      income: {
        title: "Income",
        type: TransactionType.INCOME,
        actualPercentage: "100%",
        maxPercentage: "100%",
        actualAmount: formatCurrency(actualMonthIncome),
        maxAmount: formatCurrency(plannedIncome),
        items: incomeTransactions.map(t => ({ id: t.id, description: t.description, amount: t.amount.toNumber() })),
      },
      needs: calculateCategoryData(TransactionType.NEEDS, 50),
      wants: calculateCategoryData(TransactionType.WANTS, 30),
      reserves: calculateCategoryData(TransactionType.RESERVES, 10),
      investments: calculateCategoryData(TransactionType.INVESTMENTS, 10),
    };

    return NextResponse.json(financialData);

  } catch (error) {
    console.error("Erro na API do Dashboard:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}