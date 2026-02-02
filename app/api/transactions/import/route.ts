// ============================================================================
// IMPORTS
// ============================================================================
// External
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

// Internal - Types
import { TransactionType } from "@/app/generated/prisma";
import { SessionUser } from "@/app/lib/auth-server";
import {
  AuthenticatedHandler,
  RouteContext,
  withAuth,
} from "@/app/lib/auth-helpers";

// Internal - Services
import { prisma } from "@/prisma/db";

// Internal - Utilities
import {
  badRequestResponse,
  internalErrorResponse,
  tooManyRequestsResponse,
} from "@/app/lib/errors/responses";
import {
  isValidTransactionType,
  isValidAmount,
  parseAndValidateDate,
  isCategoryTypeCompatible,
  sanitizeDescription,
} from "@/app/lib/validators";
import { logSuccess, logError } from "@/app/lib/logger";
import { checkRateLimit, getClientIdentifier } from "@/app/lib/rate-limiter";
import { TRANSACTION_IMPORT } from "@/app/lib/validation-constants";
import { parseCSV } from "@/app/lib/utils/csv-parser";
import { parseAmountString } from "@/app/lib/utils/amount-parser";

// ============================================================================
// TYPES
// ============================================================================
interface ParsedRow {
  description: string;
  amount: number;
  date: Date;
  type: TransactionType;
  categoryId?: number | null;
  rawData?: unknown;
}

// ============================================================================
// CSV PARSING
// ============================================================================
// CSV parsing logic moved to @/app/lib/utils/csv-parser.ts for reusability

/**
 * Map CSV row from bank format to our standard format
 * WHY: Bank CSV has different headers - need to normalize to our schema
 * Headers: Filter, Date, Description, Sub-description, Type of Transaction, Amount, Balance
 * This function handles the specific format from Brazilian banks
 * 
 * @param row - CSV row as array of strings
 * @param headerMap - Map of header names to column indices
 * @returns Normalized row object or null if row is invalid
 */
function mapBankCSVRowToStandard(
  row: string[],
  headerMap: Map<string, number>
): Record<string, unknown> | null {
  // Skip empty rows
  // WHY: Empty rows don't represent valid transactions
  if (row.every((cell) => !cell || cell.trim().length === 0)) {
    return null;
  }

  const rowObject: Record<string, unknown> = {};

  // Get column indices
  const dateIdx = headerMap.get("date");
  const descriptionIdx = headerMap.get("description");
  const subDescriptionIdx = headerMap.get("sub-description");
  const typeIdx = headerMap.get("type of transaction");
  const amountIdx = headerMap.get("amount");

  // Validate required columns exist
  if (
    dateIdx === undefined ||
    amountIdx === undefined ||
    typeIdx === undefined
  ) {
    return null; // Skip row if required columns missing
  }

  // 1. Description: Use Sub-description, fallback to Description
  // WHY: Sub-description is usually more specific (e.g., "PIX Transfer") than main description
  if (subDescriptionIdx !== undefined && row[subDescriptionIdx]?.trim()) {
    rowObject.description = row[subDescriptionIdx].trim();
  } else if (descriptionIdx !== undefined && row[descriptionIdx]?.trim()) {
    rowObject.description = row[descriptionIdx].trim();
  } else {
    return null; // Skip row if no description available
  }

  // 2. Date: Parse Date column (Format YYYY-MM-DD)
  const dateString = row[dateIdx]?.trim();
  if (!dateString) {
    return null; // Skip row if no date
  }
  rowObject.date = dateString;

  // 3. Amount: Parse Amount column using utility function
  const amountStr = row[amountIdx]?.trim() || "";
  const parsedAmount = parseAmountString(amountStr);
  
  if (parsedAmount === null) {
    return null; // Skip row if amount is invalid
  }
  
  rowObject.amount = parsedAmount;

  // 4. Type Mapping: Credit/positive -> INCOME, Debit/negative -> NEEDS
  // WHY: Bank CSV uses "credit"/"debit" terminology, we map to our transaction types
  const typeString = row[typeIdx]?.trim().toLowerCase() || "";

  // Determine type based on Type of Transaction column first, then amount sign
  // WHY: Bank CSV may have explicit type, but we also infer from amount sign as fallback
  if (typeString === "credit" || parsedAmount > 0) {
    rowObject.type = "INCOME";
  } else if (typeString === "debit" || parsedAmount < 0) {
    rowObject.type = "NEEDS";
  } else {
    // Default to NEEDS if we can't determine (shouldn't happen, but safe fallback)
    rowObject.type = "NEEDS";
  }

  // Store raw data for reference
  // WHY: Preserve original data for debugging and user review
  rowObject.rawData = {
    filter: headerMap.has("filter") ? row[headerMap.get("filter")!] : null,
    date: dateString,
    description: descriptionIdx !== undefined ? row[descriptionIdx] : null,
    subDescription:
      subDescriptionIdx !== undefined ? row[subDescriptionIdx] : null,
    typeOfTransaction: typeString,
    amount: amountStr,
    balance: headerMap.has("balance") ? row[headerMap.get("balance")!] : null,
  };

  return rowObject;
}

/**
 * Parse CSV file into array of objects
 * WHY: Converts CSV rows to structured objects for validation
 * Handles bank-specific CSV format with custom headers
 */
/**
 * Parse CSV file into array of objects
 * WHY: Converts CSV rows to structured objects for validation
 * Handles bank-specific CSV format with custom headers
 * 
 * @param content - Raw CSV file content
 * @returns Array of row objects with normalized headers
 */
function parseCSVFile(content: string): unknown[] {
  const rows = parseCSV(content);
  if (rows.length === 0) {
    return [];
  }

  // First row is header - normalize to lowercase for matching
  // WHY: Case-insensitive header matching improves compatibility with various CSV formats
  const headers = rows[0].map((header) => String(header).toLowerCase().trim());
  const dataRows = rows.slice(1);

  // Create header map for efficient lookup
  const headerMap = new Map<string, number>();
  headers.forEach((header, index) => {
    headerMap.set(header, index);
  });

  // Check if this is the bank CSV format
  const isBankFormat =
    headerMap.has("date") &&
    headerMap.has("amount") &&
    headerMap.has("type of transaction");

  if (isBankFormat) {
    // Use bank-specific mapping
    return dataRows
      .map((row) => mapBankCSVRowToStandard(row, headerMap))
      .filter((obj): obj is Record<string, unknown> => obj !== null);
  }

  // Fallback to standard CSV format (original logic)
  // WHY: Supports generic CSV format when bank-specific format is not detected
  return dataRows
    .map((row) => {
      // Skip empty rows
      if (row.every((cell) => !cell || cell.trim().length === 0)) {
        return null;
      }

      const rowObject: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index] || "";
      });
      return rowObject;
    })
    .filter((rowObject): rowObject is Record<string, unknown> => rowObject !== null);
}

// ============================================================================
// VALIDATION
// ============================================================================
/**
 * Validate and parse a single row from CSV/JSON
 * WHY: Centralized validation ensures data integrity before creating pending transactions
 * Validates all required fields, sanitizes input, and checks category compatibility
 */
function validateAndParseRow(
  row: unknown,
  userId: number,
  categories: Map<number, { type: TransactionType; userId: number }>
): { valid: boolean; data?: ParsedRow; error?: string } {
  if (typeof row !== "object" || row === null || Array.isArray(row)) {
    return { valid: false, error: "Invalid row format" };
  }

  const rowObject = row as Record<string, unknown>;

  // Required fields
  if (!rowObject.description || rowObject.amount == null || !rowObject.type || !rowObject.date) {
    return {
      valid: false,
      error: "Missing required fields: description, amount, type, date",
    };
  }

  // Sanitize description
  const description = sanitizeDescription(String(rowObject.description));
  if (description.length === 0) {
    return { valid: false, error: "Description cannot be empty" };
  }

  // Validate transaction type
  const typeString = String(rowObject.type).toUpperCase();
  if (!isValidTransactionType(typeString)) {
    return {
      valid: false,
      error: `Invalid transaction type: ${rowObject.type}`,
    };
  }
  const transactionType = typeString as TransactionType;

  // Validate amount
  const amount =
    typeof rowObject.amount === "number"
      ? rowObject.amount
      : parseFloat(String(rowObject.amount).replace(",", "."));

  if (!isValidAmount(amount)) {
    return { valid: false, error: "Invalid amount" };
  }

  // Validate date
  const dateValidation = parseAndValidateDate(rowObject.date);
  if (!dateValidation.valid || !dateValidation.date) {
    return {
      valid: false,
      error: dateValidation.error || "Invalid date",
    };
  }

  // Validate category (if provided)
  let categoryId: number | null = null;
  if (rowObject.categoryId != null) {
    const parsedCategoryId =
      typeof rowObject.categoryId === "number"
        ? rowObject.categoryId
        : parseInt(String(rowObject.categoryId), 10);

    if (isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      return { valid: false, error: "Invalid category ID" };
    }

    const category = categories.get(parsedCategoryId);
    if (!category || category.userId !== userId) {
      return { valid: false, error: "Category not found or access denied" };
    }

    if (!isCategoryTypeCompatible(category.type, transactionType)) {
      return {
        valid: false,
        error: `Category type does not match transaction type`,
      };
    }

    categoryId = parsedCategoryId;
  }

  return {
    valid: true,
    data: {
      description,
      amount,
      date: dateValidation.date,
      type: transactionType,
      categoryId,
      rawData: rowObject,
    },
  };
}

// ============================================================================
// DUPLICATE CHECKING
// ============================================================================
/**
 * Check for duplicates efficiently using batch query
 * WHY: Batch query is O(n) vs O(n²) for individual checks, critical for large imports
 * Returns Set of string keys "date|amount" for duplicates
 */
async function findDuplicates(
  userId: number,
  rows: ParsedRow[]
): Promise<Set<string>> {
  if (rows.length === 0) {
    return new Set();
  }

  // Build date range for efficient query
  const dates = rows.map((r) => r.date);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Query existing transactions in date range
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: minDate,
        lte: maxDate,
      },
    },
    select: {
      date: true,
      amount: true,
    },
  });

  // Create lookup map: "date|amount" -> true
  // WHY: Normalize amounts to match database DECIMAL(10,2) precision for accurate duplicate detection
  const existingMap = new Set<string>();
  existingTransactions.forEach((transaction) => {
    // Normalize date to day (ignore time)
    const dateKey = transaction.date.toISOString().split("T")[0];
    // Normalize amount to match database precision
    const amountValue = Number(transaction.amount);
    const amountKey = amountValue.toFixed(TRANSACTION_IMPORT.AMOUNT_DECIMAL_PLACES);
    existingMap.add(`${dateKey}|${amountKey}`);
  });

  // Check which rows are duplicates
  const duplicates = new Set<string>();
  rows.forEach((row) => {
    const dateKey = row.date.toISOString().split("T")[0];
    // Normalize amount to match database precision
    const amountKey = row.amount.toFixed(TRANSACTION_IMPORT.AMOUNT_DECIMAL_PLACES);
    const duplicateKey = `${dateKey}|${amountKey}`;
    if (existingMap.has(duplicateKey)) {
      duplicates.add(duplicateKey);
    }
  });

  return duplicates;
}

// ============================================================================
// HANDLERS
// ============================================================================
const postHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  try {
    // ------------------------------------------------------------------------
    // Rate Limiting (SECURITY: Prevent abuse of import endpoint)
    // ------------------------------------------------------------------------
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`import:${clientId}`, {
      maxRequests: TRANSACTION_IMPORT.RATE_LIMIT.MAX_REQUESTS,
      windowMs: TRANSACTION_IMPORT.RATE_LIMIT.WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      const minutesUntilReset = Math.ceil(
        (rateLimit.resetTime - Date.now()) / TRANSACTION_IMPORT.TIME_CONVERSION.MILLISECONDS_PER_MINUTE
      );
      return tooManyRequestsResponse(
        `Too many import attempts. Please try again after ${minutesUntilReset} minutes.`
      );
    }

    // ------------------------------------------------------------------------
    // Parse FormData
    // ------------------------------------------------------------------------
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return badRequestResponse("No file provided");
    }

    // ------------------------------------------------------------------------
    // Validate File Size
    // ------------------------------------------------------------------------
    if (file.size > TRANSACTION_IMPORT.MAX_FILE_SIZE_BYTES) {
      return badRequestResponse(
        `File size exceeds maximum of ${TRANSACTION_IMPORT.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`
      );
    }

    // ------------------------------------------------------------------------
    // Validate File Type
    // ------------------------------------------------------------------------
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isCSV =
      fileType === "text/csv" ||
      fileName.endsWith(".csv") ||
      fileType === "application/vnd.ms-excel";
    const isJSON =
      fileType === "application/json" || fileName.endsWith(".json");

    if (!isCSV && !isJSON) {
      return badRequestResponse(
        "Invalid file type. Only CSV and JSON files are supported"
      );
    }

    // ------------------------------------------------------------------------
    // Read File Content
    // ------------------------------------------------------------------------
    const fileContent = await file.text();
    if (!fileContent || fileContent.trim().length === 0) {
      return badRequestResponse("File is empty");
    }

    // ------------------------------------------------------------------------
    // Parse File Content
    // ------------------------------------------------------------------------
    let parsedRows: unknown[];
    try {
      if (isJSON) {
        const jsonData = JSON.parse(fileContent);
        if (!Array.isArray(jsonData)) {
          return badRequestResponse("JSON file must contain an array of objects");
        }
        parsedRows = jsonData;
      } else {
        parsedRows = parseCSVFile(fileContent);
      }
    } catch (error) {
      return badRequestResponse(
        `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    if (parsedRows.length === 0) {
      return badRequestResponse("No data rows found in file");
    }

    // ------------------------------------------------------------------------
    // Validate Row Count (CRITICAL: Prevent memory exhaustion)
    // ------------------------------------------------------------------------
    if (parsedRows.length > TRANSACTION_IMPORT.MAX_ROWS) {
      return badRequestResponse(
        `File contains too many rows (${parsedRows.length}). Maximum allowed: ${TRANSACTION_IMPORT.MAX_ROWS}`
      );
    }

    // ------------------------------------------------------------------------
    // Load User Categories (for validation)
    // ------------------------------------------------------------------------
    const categories = await prisma.category.findMany({
      where: { userId: session.userId },
      select: { id: true, type: true, userId: true },
    });

    const categoryMap = new Map(
      categories.map((category) => [category.id, { type: category.type, userId: category.userId }])
    );

    // ------------------------------------------------------------------------
    // Validate and Parse All Rows
    // ------------------------------------------------------------------------
    const validatedRows: ParsedRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const validation = validateAndParseRow(
        parsedRows[i],
        session.userId,
        categoryMap
      );

      if (!validation.valid || !validation.data) {
        errors.push(`Row ${i + 1}: ${validation.error || "Validation failed"}`);
        continue;
      }

      validatedRows.push(validation.data);
    }

    if (validatedRows.length === 0) {
      return badRequestResponse(
        `No valid rows found. Errors: ${errors.slice(0, 5).join("; ")}`
      );
    }

    // ------------------------------------------------------------------------
    // Check for Duplicates
    // ------------------------------------------------------------------------
    const duplicateKeys = await findDuplicates(session.userId, validatedRows);

    // ------------------------------------------------------------------------
    // Create Pending Transactions (Atomic Operation)
    // ------------------------------------------------------------------------
    // WHY: Set expiration to allow users time to review while preventing database bloat
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TRANSACTION_IMPORT.EXPIRATION_HOURS);

    const createdTransactions = await prisma.$transaction(
      async (tx) => {
      const creates = validatedRows.map((validatedRow) => {
        const dateKey = validatedRow.date.toISOString().split("T")[0];
        // Normalize amount to match database precision for duplicate detection
        const amountKey = validatedRow.amount.toFixed(
          TRANSACTION_IMPORT.AMOUNT_DECIMAL_PLACES
        );
        const duplicateKey = `${dateKey}|${amountKey}`;
        const isDuplicate = duplicateKeys.has(duplicateKey);

        return tx.pendingTransaction.create({
          data: {
            description: validatedRow.description,
            amount: new Decimal(validatedRow.amount),
            date: validatedRow.date,
            type: validatedRow.type,
            categoryId: validatedRow.categoryId,
            userId: session.userId,
            expiresAt,
            isDuplicate,
            rawData: validatedRow.rawData ? JSON.stringify(validatedRow.rawData) : null,
          },
        });
      });

        return Promise.all(creates);
      },
      {
        maxWait: TRANSACTION_IMPORT.PRISMA_TRANSACTION.MAX_WAIT_MS,
        timeout: TRANSACTION_IMPORT.PRISMA_TRANSACTION.TIMEOUT_MS,
      }
    );

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    const createdIds = createdTransactions.map((transaction) => transaction.id);
    const duplicateCount = createdTransactions.filter((transaction) => transaction.isDuplicate).length;

    logSuccess("Transactions imported successfully", {
      userId: session.userId,
      totalRows: parsedRows.length,
      validRows: validatedRows.length,
      createdCount: createdIds.length,
      duplicateCount,
      errorsCount: errors.length,
    });

    return NextResponse.json(
      {
        success: true,
        createdIds,
        stats: {
          total: parsedRows.length,
          valid: validatedRows.length,
          created: createdIds.length,
          duplicates: duplicateCount,
          errors: errors.length,
        },
        errors: errors.slice(0, TRANSACTION_IMPORT.MAX_ERRORS_IN_RESPONSE),
      },
      { status: 201 }
    );
  } catch (error) {
    logError("Failed to import transactions", error, {
      userId: session.userId,
    });
    return internalErrorResponse("Failed to import transactions");
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export const POST = withAuth(postHandler, {
  requireCsrf: true,
  requireContentType: true,
  allowedContentTypes: ["multipart/form-data"],
});
