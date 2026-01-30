/**
 * Simple In-Memory Cache
 * For production, consider using Redis or similar distributed cache
 */

import { logInfo } from "@/app/lib/logger";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (process.env.NODE_ENV === 'development') {
        logInfo('Cache miss', { key });
      }
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      if (process.env.NODE_ENV === 'development') {
        logInfo('Cache expired', { key });
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      logInfo('Cache hit', { key });
    }
    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiresAt });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new SimpleCache();

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator 
      ? keyGenerator(...args)
      : `cache:${fn.name}:${JSON.stringify(args)}`;
    
    const cached = cache.get<ReturnType<T>>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  }) as T;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern: string): number {
  let count = 0;
  const regex = new RegExp(pattern);
  
  for (const key of cache.getStats().keys) {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  }
  
  return count;
}
