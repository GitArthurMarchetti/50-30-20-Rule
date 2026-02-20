import { PrismaClient } from "@/app/generated/prisma"
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { logError, logWarning, logInfo } from "@/app/lib/logger"
import { validateEnvVarsOrThrow } from "@/app/lib/env-validator"

// Validate environment variables at startup
if (typeof window === 'undefined') {
  // Only validate on server-side
  try {
    validateEnvVarsOrThrow();
  } catch (error) {
    logError('Environment validation failed', error);
    // In production, we might want to exit, but in dev we can continue
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

// Create PostgreSQL connection pool
// WHY: Lazy initialization ensures DATABASE_URL is available
// Pool is created only when PrismaClient is instantiated
function createAdapter() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Please check your .env or .env.local file.'
    );
  }

  const pool = new Pool({
    connectionString,
  });

  return new PrismaPg(pool);
}

/**
 * Optimized Prisma Client Configuration
 * - Connection pooling for better performance
 * - Query optimization settings
 * - Error handling improvements
 * 
 * NOTE: Prisma 7 requires either "adapter" or "accelerateUrl" in constructor
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(), // Required in Prisma 7 for engine type "client"
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn', 'query'] // Log queries in dev for debugging
      : ['error', 'warn'], // Only errors and warnings in production
    errorFormat: 'minimal', // Reduce error payload size
  })

// Optimize connection handling
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Database event logging
// Note: Prisma $on events may not work in all environments
// Consider using middleware for query logging instead
try {
  // Log slow queries from Prisma (only in development)
  if (process.env.NODE_ENV === 'development') {
    // This will only work if Prisma logging is enabled
    logInfo('Prisma client initialized with query logging', {
      environment: process.env.NODE_ENV,
    });
  }
} catch (error) {
  // Silently fail if event listeners are not supported
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    logInfo('Disconnecting from database');
    await prisma.$disconnect();
  });
  
  process.on('SIGINT', async () => {
    logInfo('SIGINT received, disconnecting from database');
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logInfo('SIGTERM received, disconnecting from database');
    await prisma.$disconnect();
    process.exit(0);
  });
}