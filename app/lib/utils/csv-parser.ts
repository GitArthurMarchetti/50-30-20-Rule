/**
 * CSV parsing utilities
 * WHY: Extracted from route handler to enable reuse and testing
 * Handles quoted fields, escaped quotes, and bank-specific CSV formats
 */

/**
 * Parse CSV content into array of string arrays (rows)
 * WHY: Custom parser needed to handle quoted fields and escaped quotes correctly
 * Standard CSV parsers may not handle edge cases like escaped quotes within quoted fields
 * 
 * @param content - Raw CSV file content as string
 * @returns Array of rows, each row is an array of field strings
 */
export function parseCSV(content: string): string[][] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" inside quoted field
        currentLine += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "\n" && !inQuotes) {
      // End of line (only if not inside quotes)
      lines.push(currentLine);
      currentLine = "";
    } else if (char !== "\r" || inQuotes) {
      // Skip \r unless inside quotes (handles Windows line endings)
      currentLine += char;
    }
  }

  // Add last line if file doesn't end with newline
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // Parse each line into fields
  return lines.map((line) => {
    const fields: string[] = [];
    let currentField = "";
    let fieldInQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (fieldInQuotes && nextChar === '"') {
          // Escaped quote within field
          currentField += '"';
          i++;
        } else {
          // Toggle quote state
          fieldInQuotes = !fieldInQuotes;
        }
      } else if (char === "," && !fieldInQuotes) {
        // Field separator (only if not inside quotes)
        fields.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }

    // Add last field
    fields.push(currentField.trim());
    return fields;
  });
}
