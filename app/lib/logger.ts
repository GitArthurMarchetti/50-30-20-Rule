import chalk from 'chalk';

/**
 * Logger utility for backend operations
 * Provides colored console output for better readability
 */

interface LogContext {
  [key: string]: unknown;
}

/**
 * Logs a success message in green
 * @param message - The message to log
 * @param context - Optional context object to include
 */
export function logSuccess(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
  console.log(chalk.green(`[SUCCESS] [${timestamp}] ${message}${contextStr}`));
}

/**
 * Logs a warning message in yellow
 * @param message - The message to log
 * @param context - Optional context object to include
 */
export function logWarning(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
  console.warn(chalk.yellow(`[WARNING] [${timestamp}] ${message}${contextStr}`));
}

/**
 * Sanitizes context to remove sensitive information before logging
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value as LogContext);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logs an error message in red
 * @param message - The message to log
 * @param error - The error object or message
 * @param context - Optional context object to include (will be sanitized)
 */
export function logError(message: string, error?: unknown, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  
  // Sanitize error message to avoid exposing sensitive data
  let errorStr = '';
  if (error instanceof Error) {
    // Only log error message, not full stack in production
    const shouldLogStack = process.env.NODE_ENV === 'development';
    errorStr = `\nError: ${error.message}${shouldLogStack && error.stack ? `\nStack: ${error.stack}` : ''}`;
  } else if (error) {
    errorStr = `\nError: ${String(error)}`;
  }
  
  const sanitizedContext = sanitizeContext(context);
  const contextStr = sanitizedContext ? `\nContext:\n${JSON.stringify(sanitizedContext, null, 2)}` : '';
  console.error(chalk.red(`[ERROR] [${timestamp}] ${message}${errorStr}${contextStr}`));
}

/**
 * Logs an info message in blue (for general information)
 * @param message - The message to log
 * @param context - Optional context object to include
 */
export function logInfo(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
  console.log(chalk.blue(`[INFO] [${timestamp}] ${message}${contextStr}`));
}

