// ============================================================================
// IMPORTS
// ============================================================================
// External
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

// Internal - Types
import { SessionUser } from "@/app/lib/auth-server";
import {
  AuthenticatedHandler,
  RouteContext,
  withAuth,
} from "@/app/lib/auth-helpers";

// Internal - Services
import { prisma } from "@/prisma/db";
import { updateMonthlySummaryIncrementalWithTx } from "@/app/lib/services/summary-service";

// Internal - Utilities
import {
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/app/lib/errors/responses";
import { safeParseJson, isCategoryTypeCompatible } from "@/app/lib/validators";
import { logSuccess, logError } from "@/app/lib/logger";
import { TRANSACTION_IMPORT } from "@/app/lib/validation-constants";

// ============================================================================
// TYPES
// ============================================================================
type RouteParams = {
  id: string;
};

/**
 * Result of committing a single pending transaction
 * WHY: Tracks success/failure per transaction for batch operations
 */
interface CommitResult {
  id: number;
  success: boolean;
  transactionId?: number;
  error?: string;
}

// ============================================================================
// HANDLERS
// ============================================================================
const postHandler: AuthenticatedHandler<RouteParams> = async (
  request: NextRequest,
  context: RouteContext<RouteParams>,
  session: SessionUser
) => {
  try {
    // ------------------------------------------------------------------------
    // Parse Request Body (for batch commit)
    // ------------------------------------------------------------------------
    // WHY: Allow empty body for single commit (ID from path), only require body for batch
    let body: { ids?: unknown[] } = {};
    
    // Check if request has a body
    const requestText = await request.text();
    if (requestText && requestText.trim().length > 0) {
      try {
        const parsed = JSON.parse(requestText) as { ids?: unknown[] };
        body = parsed;
      } catch {
        return badRequestResponse("Invalid JSON format in request body");
      }
    }
    // If body is empty, that's fine - we'll use ID from path for single commit

    // ------------------------------------------------------------------------
    // Determine IDs to commit (batch or single)
    // ------------------------------------------------------------------------
    let idsToCommit: number[] = [];

    if (body.ids && Array.isArray(body.ids)) {
      // Batch commit: use IDs from body
      const parsedIds = body.ids
        .map((id) => {
          if (typeof id === "number") return id;
          const parsed = parseInt(String(id), 10);
          return isNaN(parsed) ? null : parsed;
        })
        .filter((id): id is number => id !== null && id > 0);

      if (parsedIds.length === 0) {
        return badRequestResponse(
          "Invalid IDs array. Must contain at least one valid ID"
        );
      }

      idsToCommit = parsedIds;
    } else {
      // Single commit: use ID from path
      const { id } = await context.params;
      const pendingTransactionId = parseInt(id, 10);

      if (isNaN(pendingTransactionId)) {
        return badRequestResponse("Invalid ID");
      }

      idsToCommit = [pendingTransactionId];
    }

    // ------------------------------------------------------------------------
    // Fetch Pending Transactions (validate ownership and existence)
    // ------------------------------------------------------------------------
    const pendingTransactions = await prisma.pendingTransaction.findMany({
      where: {
        id: {
          in: idsToCommit,
        },
        userId: session.userId, // Validate ownership
      },
    });

    if (pendingTransactions.length === 0) {
      return notFoundResponse(
        "No pending transactions found or access denied"
      );
    }

    // Check if all requested IDs were found
    const foundIds = new Set(pendingTransactions.map((pendingTransaction) => pendingTransaction.id));
    const missingIds = idsToCommit.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0 && idsToCommit.length === 1) {
      // Single commit: return not found if ID doesn't exist
      return notFoundResponse("Pending transaction not found");
    }

    // ------------------------------------------------------------------------
    // Commit Transactions (Atomic Operation)
    // ------------------------------------------------------------------------
    // WHY: Process individually to allow partial success - one failure doesn't block others
    // Each transaction is atomic (create Transaction + update Summary + delete Pending)
    const results: CommitResult[] = [];
    const committedIds: number[] = [];
    const errors: Array<{ id: number; error: string }> = [];
    const now = new Date();

    // Process each pending transaction
    for (const pendingTransaction of pendingTransactions) {
      // ------------------------------------------------------------------------
      // Check Expiration (CRITICAL: Prevent committing expired transactions)
      // ------------------------------------------------------------------------
      if (pendingTransaction.expiresAt < now) {
        const errorMessage = "Transaction has expired. Please re-import.";
        errors.push({
          id: pendingTransaction.id,
          error: errorMessage,
        });
        results.push({
          id: pendingTransaction.id,
          success: false,
          error: errorMessage,
        });
        continue;
      }

      // ------------------------------------------------------------------------
      // Verify Category Still Exists (if categoryId is set)
      // ------------------------------------------------------------------------
      if (pendingTransaction.categoryId) {
        const categoryExists = await prisma.category.findFirst({
          where: {
            id: pendingTransaction.categoryId,
            userId: session.userId,
          },
        });

        if (!categoryExists) {
          // Category was deleted - set to null and continue
          // WHY: Allow commit to proceed without category rather than failing
          pendingTransaction.categoryId = null;
        } else if (!isCategoryTypeCompatible(categoryExists.type, pendingTransaction.type)) {
          // Category type mismatch - set to null and continue
          // WHY: Type may have been changed, allow commit without category
          pendingTransaction.categoryId = null;
        }
      }

      try {
        // WHY: Atomic transaction ensures data consistency - all or nothing per transaction
        // If MonthlySummary update fails, Transaction creation is rolled back
        const result = await prisma.$transaction(async (transaction) => {
          // 1. Create real Transaction from PendingTransaction
          const newTransaction = await transaction.transaction.create({
            data: {
              description: pendingTransaction.description,
              amount: pendingTransaction.amount,
              type: pendingTransaction.type,
              date: pendingTransaction.date,
              categoryId: pendingTransaction.categoryId,
              userId: session.userId,
            },
          });

          // 2. Update MonthlySummary (atomic within same transaction)
          // WHY: MonthlySummary is source of truth - must stay in sync with Transactions
          await updateMonthlySummaryIncrementalWithTx(
            transaction,
            session.userId,
            pendingTransaction.date,
            {
              type: pendingTransaction.type,
              newAmount: pendingTransaction.amount,
            }
          );

          // 3. Delete PendingTransaction
          // WHY: Clean up after successful commit to prevent database bloat
          await transaction.pendingTransaction.delete({
            where: {
              id: pendingTransaction.id,
            },
          });

          return newTransaction;
        });

        committedIds.push(pendingTransaction.id);
        results.push({
          id: pendingTransaction.id,
          success: true,
          transactionId: result.id,
        });
      } catch (error) {
        // Log error for this specific transaction
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logError(
          `Failed to commit pending transaction ${pendingTransaction.id}`,
          error,
          {
            pendingTransactionId: pendingTransaction.id,
            userId: session.userId,
          }
        );

        errors.push({
          id: pendingTransaction.id,
          error: errorMessage,
        });

        results.push({
          id: pendingTransaction.id,
          success: false,
          error: errorMessage,
        });
      }
    }

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    const successCount = committedIds.length;
    const failureCount = errors.length;

    logSuccess("Pending transactions committed", {
      userId: session.userId,
      total: pendingTransactions.length,
      success: successCount,
      failures: failureCount,
      committedIds,
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          total: pendingTransactions.length,
          committed: successCount,
          failed: failureCount,
        },
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: successCount > 0 ? 200 : 500 }
    );
  } catch (error) {
    logError("Failed to commit pending transactions", error, {
      userId: session.userId,
    });
    return internalErrorResponse("Failed to commit pending transactions");
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export const POST = withAuth(postHandler, {
  requireCsrf: true,
  requireContentType: true,
});
