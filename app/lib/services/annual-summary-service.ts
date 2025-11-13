import { prisma } from "@/prisma/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function getAnnualSummary(userId: number, year: number) {
  const firstDayOfYear = new Date(year, 0, 1); 
  const lastDayOfYear = new Date(year, 11, 31, 23, 59, 59);

  const monthlySummaries = await prisma.monthlySummary.findMany({
    where: {
      userId: userId,
      month_year: {
        gte: firstDayOfYear,
        lte: lastDayOfYear,
      },
    },
    orderBy: { 
      month_year: 'asc',
    }
  });

  if (monthlySummaries.length === 0) {
    return {
      year,
      total_income: new Decimal(0),
      needs_expenses: new Decimal(0),
      wants_expenses: new Decimal(0),
      total_savings: new Decimal(0),
      total_investments: new Decimal(0),
      final_balance: new Decimal(0),
    };
  }
  const totals = monthlySummaries.reduce(
    (acc, summary) => {
      acc.total_income = acc.total_income.add(summary.total_income);
      acc.needs_expenses = acc.needs_expenses.add(summary.needs_expenses);
      acc.wants_expenses = acc.wants_expenses.add(summary.wants_expenses);
      acc.total_savings = acc.total_savings.add(summary.total_savings);
      acc.total_investments = acc.total_investments.add(summary.total_investments);
      return acc;
    },
    {
      total_income: new Decimal(0),
      needs_expenses: new Decimal(0),
      wants_expenses: new Decimal(0),
      total_savings: new Decimal(0),
      total_investments: new Decimal(0),
    }
  );



  const final_balance = monthlySummaries[monthlySummaries.length - 1].final_balance;

  return {
    year,
    ...totals, 
    final_balance,
  };
}