import { Transaction, TransactionType } from "@/app/generated/prisma";
import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse } from "@/app/lib/errors/responses";
import { formatCurrency } from "@/app/lib/formatters";
import { getOrCreateMonthlySummary } from "@/app/lib/summary-service";
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

  const currentMonthTransactions = await prisma.transaction.findMany({
    where: {
      userId: session.userId,
      date: {
        gte: firstDayOfCurrentMonth,
        lte: lastDayOfCurrentMonth,
      },
    },
    orderBy: { date: "desc" },
  });

  let baseIncome = currentMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc.add(t.amount), new Decimal(0));

  if (includeResult) {
    baseIncome = baseIncome.add(lastMonthsResultValue);
  }

  const needsExpenses = currentMonthTransactions
    .filter((t) => t.type === "NEEDS")
    .reduce((s, t) => s.add(t.amount), new Decimal(0));
  const wantsExpenses = currentMonthTransactions
    .filter((t) => t.type === "WANTS")
    .reduce((s, t) => s.add(t.amount), new Decimal(0));
  const reservesTotal = currentMonthTransactions
    .filter((t) => t.type === "RESERVES")
    .reduce((s, t) => s.add(t.amount), new Decimal(0));
  const investmentsTotal = currentMonthTransactions
    .filter((t) => t.type === "INVESTMENTS")
    .reduce((s, t) => s.add(t.amount), new Decimal(0));
  
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