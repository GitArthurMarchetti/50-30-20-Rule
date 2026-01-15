/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval: run cleanup every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupTime = Date.now();
let cleanupScheduled = false;

/**
 * Rate limiter configuration
 */
interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 5, // 5 requests
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Clean up expired entries to prevent memory leaks
 * Optimized to only run when needed
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  // Collect expired keys first (more efficient than deleting during iteration)
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      keysToDelete.push(key);
    }
  }
  
  // Delete expired entries
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
    // Use setImmediate or setTimeout(0) for non-blocking cleanup
    if (typeof setImmediate !== 'undefined') {
      setImmediate(cleanupExpiredEntries);
    } else {
      setTimeout(cleanupExpiredEntries, 0);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, email, etc.)
 * @param config - Rate limit configuration
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Schedule cleanup if needed (non-blocking)
  scheduleCleanupIfNeeded();

  // If entry doesn't exist or is expired, create/reset it
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req: Request): string {
  // Try to get IP from headers (useful behind proxies)
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  
  return ip.trim();
}
