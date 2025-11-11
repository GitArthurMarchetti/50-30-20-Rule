import { TransactionType } from "@/app/generated/prisma";

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string is a valid transaction type
 */
export function isValidTransactionType(type: string): type is TransactionType {
  return Object.values(TransactionType).includes(type as TransactionType);
}

/**
 * Validates amount (must be a positive number, not NaN, not Infinity)
 */
export function isValidAmount(amount: unknown): amount is number {
  if (typeof amount !== "number") return false;
  if (isNaN(amount)) return false;
  if (!isFinite(amount)) return false;
  if (amount < 0) return false;
  // Reasonable upper bound (1 trillion)
  if (amount > 1_000_000_000_000) return false;
  return true;
}

/**
 * Validates date string and returns Date object if valid
 */
export function parseAndValidateDate(dateString: unknown): { valid: boolean; date?: Date; error?: string } {
  if (!dateString) {
    return { valid: false, error: "Date is required" };
  }

  const date = new Date(dateString as string);
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  // Optionally: restrict future dates beyond a reasonable point
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);
  
  if (date > maxFutureDate) {
    return { valid: false, error: "Date cannot be more than 10 years in the future" };
  }

  return { valid: true, date };
}

/**
 * Validates month parameter format (YYYY-MM)
 */
export function isValidMonthFormat(month: string): boolean {
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) return false;
  
  const [year, monthNum] = month.split("-").map(Number);
  if (isNaN(year) || isNaN(monthNum)) return false;
  if (monthNum < 1 || monthNum > 12) return false;
  if (year < 1900 || year > 2100) return false;
  
  return true;
}

/**
 * Validates year parameter
 */
export function isValidYear(year: unknown): year is number {
  if (typeof year !== "number") return false;
  if (isNaN(year)) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

/**
 * Validates category name (length, not empty after trim)
 */
export function isValidCategoryName(name: unknown): { valid: boolean; error?: string } {
  if (typeof name !== "string") {
    return { valid: false, error: "Category name must be a string" };
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Category name cannot be empty" };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Category name cannot exceed 100 characters" };
  }
  
  return { valid: true };
}

/**
 * Safely parses JSON from request body with error handling
 */
export async function safeParseJson<T = unknown>(request: Request): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const text = await request.text();
    if (!text) {
      return { success: false, error: "Request body is empty" };
    }
    const data = JSON.parse(text) as T;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Invalid JSON format" };
  }
}

/**
 * Validates that a category type matches the transaction type
 */
export function isCategoryTypeCompatible(categoryType: TransactionType, transactionType: TransactionType): boolean {
  return categoryType === transactionType;
}


