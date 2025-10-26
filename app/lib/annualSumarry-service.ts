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

  const total_income = monthlySummaries
    .reduce((sum, s) => sum.add(s.total_income), new Decimal(0));

  const needs_expenses = monthlySummaries
    .reduce((sum, s) => sum.add(s.needs_expenses), new Decimal(0));

  const wants_expenses = monthlySummaries
    .reduce((sum, s) => sum.add(s.wants_expenses), new Decimal(0));

  const total_savings = monthlySummaries
    .reduce((sum, s) => sum.add(s.total_savings), new Decimal(0));

  const total_investments = monthlySummaries
    .reduce((sum, s) => sum.add(s.total_investments), new Decimal(0));

  const final_balance = total_income.sub(needs_expenses).sub(wants_expenses);

  return {
    year,
    total_income,
    needs_expenses,
    wants_expenses,
    total_savings,
    total_investments,
    final_balance,
  };
}