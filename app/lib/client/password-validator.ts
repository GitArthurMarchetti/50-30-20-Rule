/**
 * Client-side password strength validation
 * Matches server-side validation logic
 * Optimized with pre-compiled regex patterns
 */

import { PASSWORD_PATTERNS, COMMON_PASSWORD_PATTERNS, VALIDATION_LIMITS } from "@/app/lib/validation-constants";

export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
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

  const valid = score >= 3;

  if (!valid && feedback.length === 0) {
    feedback.push("Password is too weak");
  }

  return { valid, score: Math.min(4, score), feedback };
}
