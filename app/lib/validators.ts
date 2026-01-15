import { TransactionType } from "@/app/generated/prisma";
import { EMAIL_REGEX, PASSWORD_PATTERNS, COMMON_PASSWORD_PATTERNS, VALIDATION_LIMITS } from "./validation-constants";

/**
 * Validates email format
 * Uses pre-compiled regex for better performance
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
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
  } catch {
    return { success: false, error: "Invalid JSON format" };
  }
}

/**
 * Validates that a category type matches the transaction type
 */
export function isCategoryTypeCompatible(categoryType: TransactionType, transactionType: TransactionType): boolean {
  return categoryType === transactionType;
}

/**
 * Validates password strength
 * Returns validation result with strength score and feedback
 * Uses pre-compiled regex patterns for better performance
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number; // 0-4 (0 = weak, 4 = very strong)
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < VALIDATION_LIMITS.password.min) {
    feedback.push(`Password must be at least ${VALIDATION_LIMITS.password.min} characters long`);
    return { valid: false, score: 0, feedback };
  }

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Check for lowercase letters (using pre-compiled pattern)
  if (PASSWORD_PATTERNS.lowercase.test(password)) {
    score++;
  } else {
    feedback.push("Add lowercase letters");
  }

  // Check for uppercase letters (using pre-compiled pattern)
  if (PASSWORD_PATTERNS.uppercase.test(password)) {
    score++;
  } else {
    feedback.push("Add uppercase letters");
  }

  // Check for numbers (using pre-compiled pattern)
  if (PASSWORD_PATTERNS.number.test(password)) {
    score++;
  } else {
    feedback.push("Add numbers");
  }

  // Check for special characters (using pre-compiled pattern)
  if (PASSWORD_PATTERNS.special.test(password)) {
    score++;
  } else {
    feedback.push("Add special characters");
  }

  // Check for common patterns (using pre-compiled patterns)
  if (COMMON_PASSWORD_PATTERNS.some(pattern => pattern.test(password))) {
    feedback.push("Avoid common password patterns");
    score = Math.max(0, score - 1);
  }

  // Minimum score of 3 for valid password
  const valid = score >= 3;

  if (!valid && feedback.length === 0) {
    feedback.push("Password is too weak");
  }

  return { valid, score: Math.min(4, score), feedback };
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Sanitizes username
 * Uses validation constants for consistency
 */
export function sanitizeUsername(username: string): string {
  // Allow alphanumeric, underscore, hyphen, and spaces (but trim spaces)
  return username
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, "") // Remove special characters except allowed ones
    .replace(/\s+/g, " ") // Normalize spaces
    .slice(0, VALIDATION_LIMITS.username.max); // Limit length
}


