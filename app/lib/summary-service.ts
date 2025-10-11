import { TransactionType } from "@/app/generated/prisma";
import { prisma } from "@/prisma/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function getOrCreateMonthlySummary(userId: number, dateForMonth: Date) {
  const firstDayOfMonth = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });

  const total_income = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum.add(t.amount), new Decimal(0));
  
  const needs_expenses = transactions
    .filter(t => t.type === TransactionType.NEEDS)
    .reduce((sum, t) => sum.add(t.amount), new Decimal(0));

  const wants_expenses = transactions
    .filter(t => t.type === TransactionType.WANTS)
    .reduce((sum, t) => sum.add(t.amount), new Decimal(0));

  const total_savings = transactions
    .filter(t => t.type === TransactionType.RESERVES)
    .reduce((sum, t) => sum.add(t.amount), new Decimal(0));
    
  const total_investments = transactions
    .filter(t => t.type === TransactionType.INVESTMENTS)
    .reduce((sum, t) => sum.add(t.amount), new Decimal(0));

  const final_balance = total_income.sub(needs_expenses).sub(wants_expenses);

  const summaryData = {
    userId: userId,
    month_year: firstDayOfMonth,
    total_income,
    needs_expenses,
    wants_expenses,
    total_savings,
    total_investments,
    final_balance,
  };

  const summary = await prisma.monthlySummary.upsert({
    where: {
      userId_month_year: {
        userId: userId,
        month_year: firstDayOfMonth,
      }
    },
    update: summaryData, 
    create: summaryData, 
  });

  return summary;
}