// ============================================================================
// IMPORTS
// ============================================================================
// External
import { Decimal } from "@prisma/client/runtime/library";

// Internal - Types
import { TransactionType, Prisma } from "@/app/generated/prisma";

// Internal - Services
import { prisma } from "@/prisma/db";
import { getTransactionAggregationsByType } from "@/app/lib/db/query-helpers";
import {
  getTransactionTypeConfig,
  affectsSummary,
} from "./transaction-type-config";

// ============================================================================
// TYPES
// ============================================================================
type PrismaTransaction = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Helper to fetch previous month balance
 * Big-O: O(1) - lookup by unique index
 */
async function getPreviousMonthBalance(
  tx: PrismaTransaction | typeof prisma,
  userId: number,
  date: Date
): Promise<Decimal> {
  const prevMonthDate = new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );

  const prevSummary = await tx.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId,
        month_year: prevMonthDate,
      },
    },
  });

  return prevSummary?.final_balance ?? new Decimal(0);
}

/**
 * Recalculates the complete summary of a month (used for first time or manual recalculation)
 * Big-O: O(n) where n = number of transactions in the month
 * 
 * OPTIMIZATION: Uses SQL aggregation via Prisma for better performance
 * 
 * @param userId - User ID
 * @param dateForMonth - Date of the month to calculate
 * @returns Month summary
 */
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

  // OPTIMIZATION: Use optimized query helper - single GROUP BY query
  const dateRange = {
    gte: firstDayOfMonth,
    lte: lastDayOfMonth,
  };
  
  const aggregations = await getTransactionAggregationsByType(userId, dateRange);

  // OPTIMIZATION: Get values from aggregation map (O(1) lookup)
  const total_income = aggregations.get(TransactionType.INCOME) ?? new Decimal(0);
  const needs_expenses = aggregations.get(TransactionType.NEEDS) ?? new Decimal(0);
  const wants_expenses = aggregations.get(TransactionType.WANTS) ?? new Decimal(0);
  const total_savings = aggregations.get(TransactionType.RESERVES) ?? new Decimal(0);
  const total_investments = aggregations.get(TransactionType.INVESTMENTS) ?? new Decimal(0);
  
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

/**
 * Updates the summary incrementally when a transaction changes
 * 
 * OPTIMIZATION: O(1) - only updates the specific field instead of recalculating everything
 * 
 * @param userId - User ID
 * @param monthDate - Date of the month to update
 * @param transactionDelta - Transaction difference (oldAmount to remove, newAmount to add)
 * @returns Updated summary
 */
export async function updateMonthlySummaryIncremental(
  userId: number,
  monthDate: Date,
  transactionDelta: {
    type: TransactionType;
    oldAmount?: Decimal; // undefined se for criação
    newAmount?: Decimal; // undefined se for deleção
  }
) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  
  // Fetch current summary (or create if it doesn't exist)
  const currentSummary = await prisma.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    }
  });

  // If it doesn't exist, recalculate everything (first time)
  if (!currentSummary) {
    return await getOrCreateMonthlySummary(userId, monthDate);
  }

  // Check if the type affects the summary using centralized configuration
  if (!affectsSummary(transactionDelta.type)) {
    // Type doesn't affect summary (e.g., ROLLOVER)
    return currentSummary;
  }

  // Get type configuration - O(1) lookup in Record
  const config = getTransactionTypeConfig(transactionDelta.type);
  
  if (!config.summaryField) {
    return currentSummary;
  }

  // Calculate the difference
  let delta = new Decimal(0);
  if (transactionDelta.oldAmount) {
    delta = delta.sub(transactionDelta.oldAmount); // Remove old value
  }
  if (transactionDelta.newAmount) {
    delta = delta.add(transactionDelta.newAmount); // Add new value
  }

  // If there's no change, return without updating
  if (delta.isZero()) {
    return currentSummary;
  }

  // Update the corresponding field dynamically using configuration
  const currentValue = currentSummary[config.summaryField] as Decimal;
  const updateData: Partial<typeof currentSummary> = {
    [config.summaryField]: currentValue.add(delta),
  };

  // Recalculate final_balance generically using configuration
  const startingBalance = await getPreviousMonthBalance(prisma, userId, monthDate);
  
  // Sum all income
  const totalIncome = (updateData.total_income ?? currentSummary.total_income) as Decimal;
  
  // Subtract all expenses using configuration to identify which are expenses
  const expenseFields: Array<keyof typeof currentSummary> = [
    'needs_expenses',
    'wants_expenses', 
    'total_savings',
    'total_investments'
  ];
  
  let totalExpenses = new Decimal(0);
  for (const field of expenseFields) {
    const value = (updateData[field] ?? currentSummary[field]) as Decimal;
    totalExpenses = totalExpenses.add(value);
  }

  updateData.final_balance = startingBalance
    .add(totalIncome)
    .sub(totalExpenses);

  return await prisma.monthlySummary.update({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    },
    data: updateData,
  });
}

/**
 * Version of the function that accepts Prisma transaction for atomic operations
 * Uses the passed transaction client instead of the global prisma
 */
export async function updateMonthlySummaryIncrementalWithTx(
  tx: PrismaTransaction,
  userId: number,
  monthDate: Date,
  transactionDelta: {
    type: TransactionType;
    oldAmount?: Decimal;
    newAmount?: Decimal;
  }
) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  
  // Fetch current summary (or create if it doesn't exist)
  const currentSummary = await tx.monthlySummary.findUnique({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    }
  });

  // If it doesn't exist, recalculate everything (first time)
  if (!currentSummary) {
    // For transactions, we need to calculate the complete summary
    // This is more complex, so we'll create a basic summary
    const prevMonthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    const previousSummary = await tx.monthlySummary.findUnique({
      where: {
        userId_month_year: {
          userId,
          month_year: prevMonthDate,
        }
      }
    });

    const starting_balance = previousSummary ? previousSummary.final_balance : new Decimal(0);
    
    // Initialize zeroed values
    const summaryData = {
      userId: userId,
      month_year: firstDayOfMonth,
      total_income: new Decimal(0),
      needs_expenses: new Decimal(0),
      wants_expenses: new Decimal(0),
      total_savings: new Decimal(0),
      total_investments: new Decimal(0),
      final_balance: starting_balance,
    };

    await tx.monthlySummary.create({ data: summaryData });
    
    // Now update with the delta
    return updateMonthlySummaryIncrementalWithTx(tx, userId, monthDate, transactionDelta);
  }

  // Check if the type affects the summary
  if (!affectsSummary(transactionDelta.type)) {
    return currentSummary;
  }

  const config = getTransactionTypeConfig(transactionDelta.type);
  
  if (!config.summaryField) {
    return currentSummary;
  }

  // Calculate the difference
  let delta = new Decimal(0);
  if (transactionDelta.oldAmount) {
    delta = delta.sub(transactionDelta.oldAmount);
  }
  if (transactionDelta.newAmount) {
    delta = delta.add(transactionDelta.newAmount);
  }

  if (delta.isZero()) {
    return currentSummary;
  }

  // Update the corresponding field
  const currentValue = currentSummary[config.summaryField] as Decimal;
  const updateData: Partial<typeof currentSummary> = {
    [config.summaryField]: currentValue.add(delta),
  };

  // Recalculate final_balance using helper
  const startingBalance = await getPreviousMonthBalance(tx, userId, monthDate);
  
  const totalIncome = (updateData.total_income ?? currentSummary.total_income) as Decimal;
  
  const expenseFields: Array<keyof typeof currentSummary> = [
    'needs_expenses',
    'wants_expenses', 
    'total_savings',
    'total_investments'
  ];
  
  let totalExpenses = new Decimal(0);
  for (const field of expenseFields) {
    const value = (updateData[field] ?? currentSummary[field]) as Decimal;
    totalExpenses = totalExpenses.add(value);
  }

  updateData.final_balance = startingBalance
    .add(totalIncome)
    .sub(totalExpenses);

  return await tx.monthlySummary.update({
    where: {
      userId_month_year: {
        userId,
        month_year: firstDayOfMonth,
      }
    },
    data: updateData,
  });
}