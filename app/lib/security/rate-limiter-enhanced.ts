/**
 * Enhanced Rate Limiter
 * Provides improved rate limiting with better memory management
 * For production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval: run cleanup every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupTime = Date.now();
let cleanupScheduled = false;

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // Duration to block after exceeding limit (optional)
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes after exceeding limit
};

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, entry] of rateLimitStore.entries()) {
    // Delete if expired and not blocked, or if block period has expired
    if (
      (entry.resetTime < now && !entry.blocked) ||
      (entry.blocked && entry.blockUntil && entry.blockUntil < now)
    ) {
      keysToDelete.push(key);
    }
  }
  
  for (const key of keysToDelete) {
    rateLimitStore.delete(key);
  }
  
  lastCleanupTime = now;
  cleanupScheduled = false;
}

/**
 * Schedule cleanup if needed (throttled)
 */
function scheduleCleanupIfNeeded(): void {
  const now = Date.now();
  if (!cleanupScheduled && (now - lastCleanupTime) >= CLEANUP_INTERVAL_MS) {
    cleanupScheduled = true;
    if (typeof setImmediate !== 'undefined') {
      setImmediate(cleanupExpiredEntries);
    } else {
      setTimeout(cleanupExpiredEntries, 0);
    }
  }
}

/**
 * Enhanced rate limiter with blocking capability
 * @param identifier - Unique identifier (IP address, email, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export function checkRateLimitEnhanced(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): { 
  allowed: boolean; 
  remaining: number; 
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  scheduleCleanupIfNeeded();

  // If entry doesn't exist or is expired, create/reset it
  if (!entry || (entry.resetTime < now && !entry.blocked)) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
      blocked: false,
    };
  }

  // Check if currently blocked
  if (entry.blocked && entry.blockUntil && entry.blockUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true,
      blockUntil: entry.blockUntil,
    };
  }

  // If block period expired, reset
  if (entry.blocked && entry.blockUntil && entry.blockUntil <= now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
      blocked: false,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    // Block if blockDurationMs is configured
    if (config.blockDurationMs) {
      entry.blocked = true;
      entry.blockUntil = now + config.blockDurationMs;
      rateLimitStore.set(identifier, entry);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: true,
        blockUntil: entry.blockUntil,
      };
    }
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: false,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
    blocked: false,
  };
}

/**
 * Clear rate limit for a specific identifier
 */
export function clearRateLimitEnhanced(identifier: string): boolean {
  return rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limits
 */
export function clearAllRateLimitsEnhanced(): number {
  const count = rateLimitStore.size;
  rateLimitStore.clear();
  return count;
}
