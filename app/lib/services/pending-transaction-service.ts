// ============================================================================
// IMPORTS
// ============================================================================
// External
import { Decimal } from "@prisma/client/runtime/library";

// Internal - Services
import { prisma } from "@/prisma/db";
import { TRANSACTION_IMPORT } from "@/app/lib/validation-constants";

// ============================================================================
// DEDUPLICATION
// ============================================================================
/**
 * Check if a transaction with the same (userId, date, amount) already exists
 * 
 * WHY: Prevents duplicate transactions from being created, maintaining data integrity
 * Uses O(1) indexed query with COUNT for efficiency instead of fetching full records
 * 
 * OTIMIZAÇÃO: O(1) - Uses indexed query with COUNT for efficiency
 * - Normalizes date to day (ignores time component)
 * - Normalizes amount to 2 decimal places (matching database precision)
 * 
 * @param userId - User ID
 * @param date - Transaction date (time component is ignored)
 * @param amount - Transaction amount (normalized to 2 decimal places)
 * @returns true if duplicate exists, false otherwise
 */
export async function checkForDuplicates(
  userId: number,
  date: Date,
  amount: number | Decimal
): Promise<boolean> {
  // Normalize date to start of day (ignore time component)
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Normalize amount to Decimal for Prisma comparison
  // Note: Amount is stored as DECIMAL(10,2) in database
  const amountDecimal =
    amount instanceof Decimal ? amount : new Decimal(amount);

  // Query for existing transaction with same userId, date (day), and amount
  // Uses date range to match the entire day
  const startOfDay = normalizedDate;
  const endOfDay = new Date(normalizedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Use COUNT for efficiency - only checks existence, doesn't fetch data
  const count = await prisma.transaction.count({
    where: {
      userId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      // Prisma Decimal comparison: use equals for exact match
      // Note: Amount is stored as DECIMAL(10,2) in database
      amount: amountDecimal,
    },
  });

  return count > 0;
}

/**
 * Batch check for duplicates across multiple transactions
 * 
 * WHY: Single batch query is O(n) vs O(n²) for individual checks - critical for import performance
 * Reduces database round trips from n to 1, dramatically improving large import speed
 * 
 * OTIMIZAÇÃO: O(n) where n = number of transactions
 * - Single query with date range and IN clause for amounts
 * - More efficient than calling checkForDuplicates multiple times
 * 
 * @param userId - User ID
 * @param transactions - Array of { date, amount } objects
 * @returns Map of "date|amount" -> boolean (true if duplicate)
 */
export async function checkForDuplicatesBatch(
  userId: number,
  transactions: Array<{ date: Date; amount: number | Decimal }>
): Promise<Map<string, boolean>> {
  if (transactions.length === 0) {
    return new Map();
  }

  // Normalize all dates to start of day
  const normalizedDates = transactions.map((tx) => {
    const normalized = new Date(tx.date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  });

  // Find date range for efficient query
  const dates = normalizedDates;
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  maxDate.setHours(23, 59, 59, 999);

  // Normalize amounts to Decimal
  const amounts = transactions.map((tx) =>
    tx.amount instanceof Decimal ? tx.amount : new Decimal(tx.amount)
  );

  // Query existing transactions in date range
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: minDate,
        lte: maxDate,
      },
      amount: {
        in: amounts,
      },
    },
    select: {
      date: true,
      amount: true,
    },
  });

  // Create lookup map: "date|amount" -> true
  const existingMap = new Set<string>();
  existingTransactions.forEach((tx) => {
    // Normalize date to day (ignore time)
    const dateKey = tx.date.toISOString().split("T")[0];
    // Normalize amount to match database precision for consistent comparison
    const amountValue = Number(tx.amount);
    const amountKey = amountValue.toFixed(TRANSACTION_IMPORT.AMOUNT_DECIMAL_PLACES);
    existingMap.add(`${dateKey}|${amountKey}`);
  });

  // Check which transactions are duplicates
  const result = new Map<string, boolean>();
  transactions.forEach((tx, index) => {
    const dateKey = normalizedDates[index].toISOString().split("T")[0];
    // Normalize amount to match database precision
    const amountValue =
      tx.amount instanceof Decimal ? Number(tx.amount) : tx.amount;
    const amountKey = amountValue.toFixed(TRANSACTION_IMPORT.AMOUNT_DECIMAL_PLACES);
    const key = `${dateKey}|${amountKey}`;
    result.set(key, existingMap.has(key));
  });

  return result;
}
