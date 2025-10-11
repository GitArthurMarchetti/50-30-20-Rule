import { Transaction, TransactionType } from "@/app/generated/prisma";
import { getSessionUser } from "@/app/lib/auth-server";
import { formatCurrency } from "@/app/lib/formatters";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
import { prisma } from "@/prisma/db";
import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";


const calculateCategoryData = (type: TransactionType, targetPercentage: number, transactions: Transaction[], baseIncome: Decimal) => {
  const categoryTransactions = transactions.filter(t => t.type === type);
  const actualAmountSpent = categoryTransactions.reduce((acc, t) => acc.add(t.amount), new Decimal(0));
  const maxAmount = baseIncome.mul(targetPercentage / 100);
  const actualPercentage = baseIncome.isZero() ? 0 : actualAmountSpent.div(baseIncome).mul(100).toNumber();
  return {
    title: type.charAt(0) + type.slice(1).toLowerCase(),
    type,
    actualPercentage: `${actualPercentage.toFixed(2)}%`.replace('.', ','),
    maxPercentage: `${targetPercentage}%`,
    actualAmount: formatCurrency(actualAmountSpent),
    maxAmount: formatCurrency(maxAmount),
    items: categoryTransactions.map(t => ({ id: t.id, description: t.description, amount: t.amount.toNumber() })),
  };
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth();
    const includeResult = searchParams.get('includeResult') !== 'false';

    const firstDayOfPreviousMonth = new Date(year, month - 1, 1);
    const previousMonthSummary = await getOrCreateMonthlySummary(session.userId, firstDayOfPreviousMonth);
    const lastMonthsResultValue = previousMonthSummary.final_balance;

    const firstDayOfCurrentMonth = new Date(year, month, 1);
    const lastDayOfCurrentMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        date: {
          gte: firstDayOfCurrentMonth,
          lte: lastDayOfCurrentMonth,
        }
      },
      orderBy: { date: 'desc' }
    });

    let baseIncome = currentMonthTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc.add(t.amount), new Decimal(0));
    if (includeResult) {
      baseIncome = baseIncome.add(lastMonthsResultValue);
    }

    const needsExpenses = currentMonthTransactions.filter(t => t.type === 'NEEDS').reduce((s, t) => s.add(t.amount), new Decimal(0));
    const wantsExpenses = currentMonthTransactions.filter(t => t.type === 'WANTS').reduce((s, t) => s.add(t.amount), new Decimal(0));
    const reservesTotal = currentMonthTransactions.filter(t => t.type === 'RESERVES').reduce((s, t) => s.add(t.amount), new Decimal(0));
    const result = baseIncome.sub(needsExpenses).sub(wantsExpenses);

    const responseData = {
      cards: {
        income: calculateCategoryData(TransactionType.INCOME, 100, currentMonthTransactions, baseIncome),
        needs: calculateCategoryData(TransactionType.NEEDS, 50, currentMonthTransactions, baseIncome),
        wants: calculateCategoryData(TransactionType.WANTS, 30, currentMonthTransactions, baseIncome),
        reserves: calculateCategoryData(TransactionType.RESERVES, 10, currentMonthTransactions, baseIncome),
        investments: calculateCategoryData(TransactionType.INVESTMENTS, 10, currentMonthTransactions, baseIncome),
      },
      financialStatement: {
        revenue: baseIncome.toNumber(),
        fixedExpenses: needsExpenses.toNumber(),
        variableExpenses: wantsExpenses.toNumber(),
        reserves: reservesTotal.toNumber(),
        result: result.toNumber(),
      },
      lastMonthsResult: lastMonthsResultValue.toNumber(),
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Erro na API do Dashboard:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}