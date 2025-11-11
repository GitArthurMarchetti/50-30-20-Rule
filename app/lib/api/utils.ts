/**
 * Utility functions for API operations
 */

/**
 * Formats a Date object to YYYY-MM format for API requests
 * @param date - Date object to format
 * @returns Formatted string in YYYY-MM format
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parses a date string from API response
 * @param dateString - Date string from API
 * @returns Date object
 */
export function parseDateFromAPI(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Formats a date for input fields (YYYY-MM-DD)
 * @param date - Date object or string
 * @returns Formatted string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

