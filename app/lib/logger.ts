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
 * Logs an error message in red
 * @param message - The message to log
 * @param error - The error object or message
 * @param context - Optional context object to include
 */
export function logError(message: string, error?: unknown, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const errorStr = error instanceof Error 
    ? `\nError: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`
    : error 
    ? `\nError: ${String(error)}`
    : '';
  const contextStr = context ? `\nContext:\n${JSON.stringify(context, null, 2)}` : '';
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

