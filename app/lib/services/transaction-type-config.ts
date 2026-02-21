import { TransactionType } from "@/app/generated/prisma";

/**
 * Names of MonthlySummary fields that can be affected by transactions
 */
type SummaryFieldName = 
  | 'total_income' 
  | 'needs_expenses' 
  | 'wants_expenses' 
  | 'total_savings' 
  | 'total_investments';

/**
 * Configuration of how each TransactionType affects MonthlySummary
 */
type TransactionTypeConfig = {
  summaryField: SummaryFieldName | null; // null = doesn't affect summary (e.g., ROLLOVER)
  isIncome: boolean; // true = adds to balance, false = subtracts from balance
  affectsBalance: boolean; // whether it affects the final_balance calculation
};

/**
 * Centralized configuration of TransactionType → Summary Field mapping
 * 
 * DATA STRUCTURE: Record<TransactionType, TransactionTypeConfig>
 * - Performance: O(1) lookup - direct access by key
 * - Type Safety: TypeScript validates that ALL enum types are present
 * - Scalable: Adding new type = just one line in this object
 * - Immutable: 'as const' prevents accidental mutations
 * - Compile-time checks: If a type is missing, TypeScript ERRORS at compile-time
 */
export const TRANSACTION_TYPE_CONFIG = {
  [TransactionType.INCOME]: {
    summaryField: 'total_income' as const,
    isIncome: true,
    affectsBalance: true,
  },
  [TransactionType.NEEDS]: {
    summaryField: 'needs_expenses' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.WANTS]: {
    summaryField: 'wants_expenses' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.RESERVES]: {
    summaryField: 'total_savings' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.INVESTMENTS]: {
    summaryField: 'total_investments' as const,
    isIncome: false,
    affectsBalance: true,
  },
  [TransactionType.ROLLOVER]: {
    summaryField: null,
    isIncome: false,
    affectsBalance: false,
  },
} as const satisfies Record<TransactionType, TransactionTypeConfig>;

/**
 * Helper to fetch configuration of a type
 * Big-O: O(1) - direct access to Record
 * 
 * @param type - Transaction type
 * @returns Type configuration
 */
export function getTransactionTypeConfig(type: TransactionType): TransactionTypeConfig {
  return TRANSACTION_TYPE_CONFIG[type];
}

/**
 * Helper to check if type affects summary
 * Big-O: O(1)
 * 
 * @param type - Transaction type
 * @returns true if the type affects the summary, false otherwise
 */
export function affectsSummary(type: TransactionType): boolean {
  return TRANSACTION_TYPE_CONFIG[type].summaryField !== null;
}

/**
 * Helper to get the summary field name for a type
 * Big-O: O(1)
 * 
 * @param type - Transaction type
 * @returns Field name or null if it doesn't affect summary
 */
export function getSummaryFieldName(type: TransactionType): SummaryFieldName | null {
  return TRANSACTION_TYPE_CONFIG[type].summaryField;
}

