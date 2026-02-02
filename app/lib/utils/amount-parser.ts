/**
 * Amount parsing utilities
 * WHY: Extracted from CSV parsing to handle various currency formats consistently
 * Supports different decimal separators (comma vs dot) and thousands separators
 */

/**
 * Parse amount string to number, handling various formats
 * WHY: Bank CSVs use different formats (1,234.56 vs 1.234,56 vs 1,23)
 * This function normalizes all formats to a standard number
 * 
 * @param amountStr - Amount as string (may include currency symbols, commas, dots)
 * @returns Parsed number or null if invalid
 */
export function parseAmountString(amountStr: string): number | null {
  // Remove quotes and whitespace
  let normalized = amountStr.replace(/^["']|["']$/g, "").trim();
  
  if (!normalized) {
    return null;
  }
  
  // Remove currency symbols, keep digits, dots, commas, and minus sign
  normalized = normalized.replace(/[^\d.,-]/g, "");
  
  // Handle different decimal separators
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");
  
  if (hasComma && hasDot) {
    // Both present: assume comma is thousands, dot is decimal (e.g., "1,234.56")
    normalized = normalized.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    // Only comma: check if it's likely decimal (2 digits after) or thousands (3 digits after)
    const parts = normalized.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator (e.g., "1,23")
      normalized = normalized.replace(",", ".");
    } else {
      // Likely thousands separator, remove it
      normalized = normalized.replace(/,/g, "");
    }
  }
  
  const parsed = parseFloat(normalized);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  // Return absolute value (our system uses positive amounts)
  return Math.abs(parsed);
}
