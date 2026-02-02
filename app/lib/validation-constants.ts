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

// Transaction import constants
// WHY: Centralized configuration for transaction import limits and behavior
// - Prevents abuse of import endpoint (rate limiting)
// - Ensures consistent TTL for pending transactions across the system
// - Limits file size to prevent memory issues and DoS attacks
export const TRANSACTION_IMPORT = {
  // Maximum file size: 5MB
  // WHY: Large enough for typical CSV/JSON files, small enough to prevent memory issues
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  
  // Pending transaction expiration: 5 hours
  // WHY: Gives users enough time to review imports without cluttering the database
  EXPIRATION_HOURS: 5,
  
  // Rate limiting: 10 imports per hour per IP/user
  // WHY: Prevents abuse while allowing legitimate bulk imports
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  },
  
  // Maximum errors to return in response
  // WHY: Prevents response bloat while still providing useful feedback
  MAX_ERRORS_IN_RESPONSE: 10,
  
  // Maximum rows allowed in import file
  // WHY: Prevents memory exhaustion and server crashes with extremely large files
  MAX_ROWS: 10000,
  
  // Decimal precision for amount comparison
  // WHY: Matches database DECIMAL(10,2) precision for consistent duplicate detection
  AMOUNT_DECIMAL_PLACES: 2,
  
  // Minimum valid amount
  // WHY: Prevents zero or negative amounts which don't make financial sense
  MIN_AMOUNT: 0,
  
  // Prisma transaction timeout configuration
  // WHY: Prevents long-running transactions from blocking the database
  // maxWait: Maximum time to wait for transaction to start (5 seconds)
  // timeout: Maximum time for transaction to complete (20 seconds)
  PRISMA_TRANSACTION: {
    MAX_WAIT_MS: 5000,
    TIMEOUT_MS: 20000,
  },
  
  // UI progress update intervals
  // WHY: Provides smooth user feedback during file uploads
  UPLOAD_PROGRESS: {
    INTERVAL_MS: 200, // Update progress every 200ms
    INCREMENT_PERCENT: 10, // Increase by 10% each interval
    MAX_BEFORE_COMPLETE: 90, // Stop at 90% until actual completion
    AUTO_CLOSE_DELAY_MS: 2000, // Close dialog 2 seconds after success
  },
  
  // Time conversion constants
  // WHY: Centralized conversion factors for consistent time calculations
  TIME_CONVERSION: {
    MILLISECONDS_PER_MINUTE: 60 * 1000,
    MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  },
} as const;
