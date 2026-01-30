/**
 * Database Query Helpers
 * Reusable, optimized database query functions
 */

import { prisma } from "@/prisma/db";
import { TransactionType } from "@/app/generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { logWarning, logInfo, logError } from "@/app/lib/logger";

export interface DateRange {
  gte: Date;
  lte: Date;
}

export interface TransactionAggregationResult {
  type: TransactionType;
  total: Decimal;
}

/**
 * Get aggregated transaction totals by type in a single optimized query
 * Uses GROUP BY for better performance than multiple aggregate queries
 * 
 * Performance: O(n) where n = number of transactions in range
 * Better than: 5 separate aggregate queries (reduces round trips)
 */
export async function getTransactionAggregationsByType(
  userId: number,
  dateRange: DateRange
): Promise<Map<TransactionType, Decimal>> {
  // Performance logging
  const start = Date.now();
  
  try {
    // Use raw query for GROUP BY aggregation (more efficient than multiple aggregates)
    // SEGURANÇA: Prisma $queryRaw usa parameterized queries, protegendo contra SQL injection
    const results = await prisma.$queryRaw<Array<{ type: TransactionType; total: Decimal }>>`
      SELECT 
        type,
        COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE "userId" = ${userId}
        AND date >= ${dateRange.gte}
        AND date <= ${dateRange.lte}
      GROUP BY type
    `;
    
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      logWarning('Slow query detected', {
        query: 'getTransactionAggregationsByType',
        duration: `${duration}ms`,
        userId,
        dateRange: `${dateRange.gte.toISOString()} to ${dateRange.lte.toISOString()}`,
      });
    } else if (duration > 500) {
      logInfo('Query performance', {
        query: 'getTransactionAggregationsByType',
        duration: `${duration}ms`,
        userId,
      });
    }

    const aggregationMap = new Map<TransactionType, Decimal>();
    
    // Initialize all types with zero
    Object.values(TransactionType).forEach(type => {
      aggregationMap.set(type, new Decimal(0));
    });

    // Fill with actual values
    results.forEach(result => {
      aggregationMap.set(
        result.type,
        result.total instanceof Decimal ? result.total : new Decimal(result.total || 0)
      );
    });

    return aggregationMap;
  } catch (error) {
    logError('Error in getTransactionAggregationsByType', error, { 
      userId, 
      dateRange: `${dateRange.gte.toISOString()} to ${dateRange.lte.toISOString()}` 
    });
    throw error;
  }
}

/**
 * Get transaction aggregations for specific types only
 * More efficient when you only need certain types
 */
export async function getTransactionAggregationsForTypes(
  userId: number,
  dateRange: DateRange,
  types: TransactionType[]
): Promise<Map<TransactionType, Decimal>> {
  if (types.length === 0) {
    return new Map();
  }

  // Performance logging
  const start = Date.now();

  const results = await prisma.$queryRaw<Array<{ type: TransactionType; total: Decimal }>>`
    SELECT 
      type,
      COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE "userId" = ${userId}
      AND date >= ${dateRange.gte}
      AND date <= ${dateRange.lte}
      AND type = ANY(${types}::"TransactionType"[])
    GROUP BY type
  `;
  
  const duration = Date.now() - start;
  
  // Log slow queries
  if (duration > 1000) {
    logWarning('Slow query detected', {
      query: 'getTransactionAggregationsForTypes',
      duration: `${duration}ms`,
      userId,
      typesCount: types.length,
    });
  }

  const aggregationMap = new Map<TransactionType, Decimal>();
  
  // Initialize requested types with zero
  types.forEach(type => {
    aggregationMap.set(type, new Decimal(0));
  });

  // Fill with actual values
  try {
    results.forEach(result => {
      aggregationMap.set(
        result.type,
        result.total instanceof Decimal ? result.total : new Decimal(result.total || 0)
      );
    });
  } catch (error) {
    logError('Error processing aggregation results', error, { userId, typesCount: types.length });
    throw error;
  }

  return aggregationMap;
}

/**
 * Get transactions with minimal fields for list display
 * Optimized select to reduce data transfer
 */
export async function getTransactionsForList(
  userId: number,
  dateRange: DateRange,
  options: {
    orderBy?: 'date' | 'amount' | 'description';
    order?: 'asc' | 'desc';
    limit?: number;
  } = {}
): Promise<Array<{
  id: number;
  description: string;
  amount: Decimal;
  date: Date;
  type: TransactionType;
  categoryId: number | null;
}>> {
  const start = Date.now();
  
  try {
    const result = await prisma.transaction.findMany({
      where: {
        userId,
        date: dateRange,
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        type: true,
        categoryId: true,
      },
      orderBy: {
        [options.orderBy || 'date']: options.order || 'desc',
      },
      take: options.limit,
    });
    
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      logWarning('Slow query detected', {
        query: 'getTransactionsForList',
        duration: `${duration}ms`,
        userId,
        transactionCount: result.length,
        limit: options.limit,
      });
    }
    
    return result;
  } catch (error) {
    logError('Error fetching transactions for list', error, { userId, dateRange, options });
    throw error;
  }
}
