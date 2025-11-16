import { Transaction, TransactionType } from "@/app/generated/prisma";
import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse } from "@/app/lib/errors/responses";
import { formatCurrency } from "@/app/lib/formatters";
import { getOrCreateMonthlySummary } from "@/app/lib/services/summary-service";
import { prisma } from "@/prisma/db";
import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { TransactionItem, DashboardData } from "@/app/types/dashboardTypes";
import { isValidMonthFormat } from "@/app/lib/validators"; 

const calculateCategoryData = (
  type: TransactionType,
  targetPercentage: number,
  transactions: Transaction[],
  baseIncome: Decimal
) => {
  const categoryTransactions = transactions.filter((t) => t.type === type);
  const actualAmountSpent = categoryTransactions.reduce(
    (acc, t) => acc.add(t.amount),
    new Decimal(0)
  );
  const maxAmount = baseIncome.mul(targetPercentage / 100);
  const actualPercentage = baseIncome.isZero()
    ? 0
    : actualAmountSpent.div(baseIncome).mul(100).toNumber();

  return {
    title: type.charAt(0) + type.slice(1).toLowerCase(),
    type,
    actualPercentage: `${actualPercentage.toFixed(2)}%`.replace(".", ","),
    maxPercentage: `${targetPercentage}%`,
    actualAmount: formatCurrency(actualAmountSpent),
    maxAmount: formatCurrency(maxAmount),
    items: categoryTransactions.map(
      (t): TransactionItem => ({
        id: t.id,
        description: t.description,
        amount: t.amount.toNumber(),
        date: t.date,
        type: t.type,
        categoryId: t.categoryId,
      })
    ),
  };
};

const getHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); 
  const includeResult = searchParams.get("includeResult") !== "false";

  if (!monthParam) {
    return badRequestResponse("Parameter 'month' (YYYY-MM) is required");
  }

  if (!isValidMonthFormat(monthParam)) {
    return badRequestResponse("Invalid month format. Expected format: YYYY-MM (e.g., 2024-01)");
  }

  const [year, monthIndex] = monthParam.split("-").map(Number);
  
  if (isNaN(year) || isNaN(monthIndex)) {
    return badRequestResponse("Invalid month format. Year and month must be valid numbers");
  } 

  const firstDayOfPreviousMonth = new Date(year, monthIndex - 2, 1);
  const previousMonthSummary = await getOrCreateMonthlySummary(
    session.userId,
    firstDayOfPreviousMonth
  );
  const lastMonthsResultValue = previousMonthSummary.final_balance;

  const firstDayOfCurrentMonth = new Date(year, monthIndex - 1, 1);
  const lastDayOfCurrentMonth = new Date(year, monthIndex, 0, 23, 59, 59);

  // OTIMIZAÇÃO: Use SQL aggregation instead of fetching all transactions and filtering in JavaScript
  // This reduces data transfer and processes in the database (O(1) vs O(n))
  const dateRange = {
    gte: firstDayOfCurrentMonth,
    lte: lastDayOfCurrentMonth,
  };

  const [
    incomeResult,
    needsResult,
    wantsResult,
    reservesResult,
    investmentsResult,
    currentMonthTransactions, // Still need transactions for items list
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: session.userId,
        date: dateRange,
        type: TransactionType.INCOME,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.userId,
        date: dateRange,
        type: TransactionType.NEEDS,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.userId,
        date: dateRange,
        type: TransactionType.WANTS,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.userId,
        date: dateRange,
        type: TransactionType.RESERVES,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.userId,
        date: dateRange,
        type: TransactionType.INVESTMENTS,
      },
      _sum: { amount: true },
    }),
    // Still fetch transactions for items list (needed for calculateCategoryData)
    prisma.transaction.findMany({
      where: {
        userId: session.userId,
        date: dateRange,
      },
      orderBy: { date: "desc" },
    }),
  ]);

  // Use aggregated results instead of filtering/reducing in JavaScript
  let baseIncome = new Decimal(incomeResult._sum.amount ?? 0);
  if (includeResult) {
    baseIncome = baseIncome.add(lastMonthsResultValue);
  }

  const needsExpenses = new Decimal(needsResult._sum.amount ?? 0);
  const wantsExpenses = new Decimal(wantsResult._sum.amount ?? 0);
  const reservesTotal = new Decimal(reservesResult._sum.amount ?? 0);
  const investmentsTotal = new Decimal(investmentsResult._sum.amount ?? 0);
  
  const result = baseIncome.sub(needsExpenses).sub(wantsExpenses).sub(reservesTotal).sub(investmentsTotal);

  const responseData: DashboardData = {
    cards: {
      income: calculateCategoryData(
        TransactionType.INCOME,
        100,
        currentMonthTransactions,
        baseIncome
      ),
      needs: calculateCategoryData(
        TransactionType.NEEDS,
        50,
        currentMonthTransactions,
        baseIncome
      ),
      wants: calculateCategoryData(
        TransactionType.WANTS,
        30,
        currentMonthTransactions,
        baseIncome
      ),
      reserves: calculateCategoryData(
        TransactionType.RESERVES,
        10,
        currentMonthTransactions,
        baseIncome
      ),
      investments: calculateCategoryData(
        TransactionType.INVESTMENTS,
        10,
        currentMonthTransactions,
        baseIncome
      ),
    },

    financialStatement: {
      revenue: baseIncome.toNumber(), 
      fixedExpenses: needsExpenses.toNumber(), 
      variableExpenses: wantsExpenses.toNumber(), 
      reserves: reservesTotal.toNumber(), 
      investments: investmentsTotal.toNumber(), 
      result: result.toNumber(), 
    },
    lastMonthsResult: lastMonthsResultValue.toNumber(),
  };

  return NextResponse.json(responseData);
};

export const GET = withAuth(getHandler);