import { TransactionType } from "@/app/generated/prisma";
import { SessionUser } from "@/app/lib/auth-server";
import { AuthenticatedHandler, RouteContext, withAuth } from "@/app/lib/auth-helpers";
import { badRequestResponse } from "@/app/lib/errors/responses";
import { formatCurrency } from "@/app/lib/formatters";
import { getOrCreateMonthlySummary } from "@/app/lib/services/summary-service";
import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { TransactionItem, DashboardData } from "@/app/types/dashboardTypes";
import { isValidMonthFormat } from "@/app/lib/validators";
import { getTransactionAggregationsByType, getTransactionsForList } from "@/app/lib/db/query-helpers";
import { logInfo } from "@/app/lib/logger"; 

type TransactionForCalculation = {
  id: number;
  description: string;
  amount: Decimal;
  date: Date;
  type: TransactionType;
  categoryId: number | null;
};

const calculateCategoryData = (
  type: TransactionType,
  targetPercentage: number,
  transactions: TransactionForCalculation[],
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
  const requestStart = Date.now();
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

  // OTIMIZAÇÃO: Use optimized query helper for aggregations
  // Single GROUP BY query instead of 5 separate aggregate queries
  const [
    aggregations,
    currentMonthTransactions,
  ] = await Promise.all([
    getTransactionAggregationsByType(session.userId, dateRange),
    getTransactionsForList(session.userId, dateRange, { orderBy: 'date', order: 'desc' }),
  ]);

  // OTIMIZAÇÃO: Get values from aggregation map (O(1) lookup)
  const monthlyIncome = aggregations.get(TransactionType.INCOME) ?? new Decimal(0);
  const needsExpenses = aggregations.get(TransactionType.NEEDS) ?? new Decimal(0);
  const wantsExpenses = aggregations.get(TransactionType.WANTS) ?? new Decimal(0);
  const reservesTotal = aggregations.get(TransactionType.RESERVES) ?? new Decimal(0);
  const investmentsTotal = aggregations.get(TransactionType.INVESTMENTS) ?? new Decimal(0);
  
  // Total available (monthlyIncome + previous balance, if included)
  let totalAvailable = monthlyIncome;
  if (includeResult) {
    totalAvailable = totalAvailable.add(lastMonthsResultValue);
  }
  
  const result = totalAvailable.sub(needsExpenses).sub(wantsExpenses).sub(reservesTotal).sub(investmentsTotal);

  const responseData: DashboardData = {
    cards: {
      income: {
        ...calculateCategoryData(
          TransactionType.INCOME,
          100,
          currentMonthTransactions,
          monthlyIncome
        ),
        monthlyIncome: monthlyIncome.toNumber(),
        previousBalance: lastMonthsResultValue.toNumber(),
        totalAvailable: totalAvailable.toNumber(),
      },
      needs: calculateCategoryData(
        TransactionType.NEEDS,
        50,
        currentMonthTransactions,
        monthlyIncome  // Uses monthlyIncome to calculate goals (50%)
      ),
      wants: calculateCategoryData(
        TransactionType.WANTS,
        30,
        currentMonthTransactions,
        monthlyIncome  // Uses monthlyIncome to calculate goals (30%)
      ),
      reserves: calculateCategoryData(
        TransactionType.RESERVES,
        10,
        currentMonthTransactions,
        monthlyIncome  // Uses monthlyIncome to calculate goals (10%)
      ),
      investments: calculateCategoryData(
        TransactionType.INVESTMENTS,
        10,
        currentMonthTransactions,
        monthlyIncome  // Uses monthlyIncome to calculate goals (10%)
      ),
    },

    financialStatement: {
      revenue: totalAvailable.toNumber(), 
      fixedExpenses: needsExpenses.toNumber(), 
      variableExpenses: wantsExpenses.toNumber(), 
      reserves: reservesTotal.toNumber(), 
      investments: investmentsTotal.toNumber(), 
      result: result.toNumber(),
      currentMonthIncome: monthlyIncome.toNumber(),
    },
    lastMonthsResult: lastMonthsResultValue.toNumber(),
  };

  const requestDuration = Date.now() - requestStart;
  
  // Log API request completion
  logInfo('Dashboard request completed', {
    userId: session.userId,
    month: monthParam,
    includeResult,
    duration: `${requestDuration}ms`,
    transactionCount: currentMonthTransactions.length,
    income: monthlyIncome.toNumber(),
    needs: needsExpenses.toNumber(),
    wants: wantsExpenses.toNumber(),
  });

  return NextResponse.json(responseData);
};

export const GET = withAuth(getHandler);