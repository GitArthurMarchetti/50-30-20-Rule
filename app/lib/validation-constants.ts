/**
 * Validation constants - compiled once for performance
 * Following DRY principle and optimizing regex compilation
 */

// Email validation regex (compiled once)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation regex (compiled once)
export const USERNAME_REGEX = /^[a-zA-Z0-9_\- ]+$/;

// Common password patterns to avoid (compiled once)
export const COMMON_PASSWORD_PATTERNS = [
  /123456/,
  /password/i,
  /qwerty/i,
  /abc123/i,
  /admin/i,
];

// Password validation regex patterns (compiled once)
export const PASSWORD_PATTERNS = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /\d/,
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

// Validation limits
export const VALIDATION_LIMITS = {
  username: {
    min: 1,
    max: 50,
  },
  password: {
    min: 6,
    max: 128,
  },
  email: {
    max: 254, // RFC 5321 limit
  },
} as const;
