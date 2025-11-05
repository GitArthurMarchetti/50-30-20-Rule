import { TransactionType } from "@/app/generated/prisma";
import { prisma } from "@/prisma/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function getOrCreateMonthlySummary(userId: number, dateForMonth: Date) {
  
  const prevMonthDate = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth() - 1, 1);
  const firstDayOfPrevMonth = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);

  const previousSummary = await prisma.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId: userId,
        month_year: firstDayOfPrevMonth,
      }
    }
  });

  const starting_balance = previousSummary ? previousSummary.final_balance : new Decimal(0);

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

  const totals: { [key: string]: Decimal } = {};
  
  for (const t of transactions) {
    const type = t.type;
    const amount = t.amount;

    if (totals[type]) {
      totals[type] = totals[type].add(amount);
    } else {
      totals[type] = amount;
    }
  }

  const total_income = totals[TransactionType.INCOME] ?? new Decimal(0);
  const needs_expenses = totals[TransactionType.NEEDS] ?? new Decimal(0);
  const wants_expenses = totals[TransactionType.WANTS] ?? new Decimal(0);
  const total_savings = totals[TransactionType.RESERVES] ?? new Decimal(0);
  const total_investments = totals[TransactionType.INVESTMENTS] ?? new Decimal(0);
  
  const final_balance = starting_balance  
    .add(total_income)         
    .sub(needs_expenses)        
    .sub(wants_expenses)
    .sub(total_savings)         
    .sub(total_investments);  

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