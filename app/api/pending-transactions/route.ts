// ============================================================================
// IMPORTS
// ============================================================================
// External
import { NextRequest, NextResponse } from "next/server";

// Internal - Types
import { SessionUser } from "@/app/lib/auth-server";
import {
  AuthenticatedHandler,
  RouteContext,
  withAuth,
} from "@/app/lib/auth-helpers";

// Internal - Services
import { prisma } from "@/prisma/db";

// Internal - Utilities
import { internalErrorResponse } from "@/app/lib/errors/responses";
import { logError, logSuccess } from "@/app/lib/logger";
import { formatPendingTransactionResponse } from "@/app/lib/utils/pending-transaction-formatter";

// ============================================================================
// HANDLERS
// ============================================================================
const getHandler: AuthenticatedHandler<Record<string, never>> = async (
  request: NextRequest,
  context: RouteContext<Record<string, never>>,
  session: SessionUser
) => {
  try {
    // ------------------------------------------------------------------------
    // Query Pending Transactions
    // ------------------------------------------------------------------------
    // Filter: userId = session.userId AND expiresAt > now()
    // Order by: date DESC (most recent date first, oldest at bottom)
    const now = new Date();

    const pendingTransactions = await prisma.pendingTransaction.findMany({
      where: {
        userId: session.userId,
        expiresAt: {
          gt: now, // Only return non-expired transactions
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        date: "desc", // Most recent date first (newest on top, oldest at bottom)
      },
    });

    // ------------------------------------------------------------------------
    // Format Response
    // ------------------------------------------------------------------------
    // WHY: Use centralized formatter to ensure consistent response structure
    const formattedTransactions = pendingTransactions.map((pendingTransaction) =>
      formatPendingTransactionResponse(pendingTransaction)
    );

    // ------------------------------------------------------------------------
    // Success Response
    // ------------------------------------------------------------------------
    logSuccess("Pending transactions fetched successfully", {
      userId: session.userId,
      count: formattedTransactions.length,
    });

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    logError("Failed to fetch pending transactions", error, {
      userId: session.userId,
    });
    return internalErrorResponse("Failed to fetch pending transactions");
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
export const GET = withAuth(getHandler);
