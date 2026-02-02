/**
 * Pending transaction response formatting utilities
 * WHY: Centralized formatting logic to ensure consistent API responses
 * Reduces code duplication across multiple route handlers
 */

import { PendingTransaction as PrismaPendingTransaction } from "@/app/generated/prisma";

/**
 * Format pending transaction for API response
 * WHY: Ensures consistent response structure across all endpoints
 * Handles Decimal to number conversion and JSON parsing safely
 * 
 * @param pendingTransaction - Prisma pending transaction with category relation
 * @returns Formatted transaction object for API response
 */
export function formatPendingTransactionResponse(
  pendingTransaction: PrismaPendingTransaction & {
    category: {
      id: number;
      name: string;
      type: string;
    } | null;
  }
) {
  // Safely parse rawData JSON
  let parsedRawData: unknown = null;
  if (pendingTransaction.rawData) {
    try {
      parsedRawData = JSON.parse(pendingTransaction.rawData);
    } catch {
      // If parsing fails, return the raw string
      parsedRawData = pendingTransaction.rawData;
    }
  }

  return {
    id: pendingTransaction.id,
    description: pendingTransaction.description,
    amount: pendingTransaction.amount.toNumber(), // Convert Decimal to number
    date: pendingTransaction.date.toISOString(),
    type: pendingTransaction.type,
    categoryId: pendingTransaction.categoryId,
    category: pendingTransaction.category
      ? {
          id: pendingTransaction.category.id,
          name: pendingTransaction.category.name,
          type: pendingTransaction.category.type,
        }
      : null,
    expiresAt: pendingTransaction.expiresAt.toISOString(),
    isDuplicate: pendingTransaction.isDuplicate,
    rawData: parsedRawData,
  };
}
