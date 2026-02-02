"use client";

// ============================================================================
// IMPORTS
// ============================================================================
// External
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Edit2,
  Loader2,
  Copy,
  X,
} from "lucide-react";

// Internal - Types
import { TransactionType } from "@/app/generated/prisma";

// Internal - Services
import { ApiError } from "@/app/lib/client/api-client";
import { getCsrfToken } from "@/app/lib/client/csrf-client";
import { categoryService, Category } from "@/app/lib/client/category-service";
import { formatCurrency } from "@/app/lib/formatters";

// Internal - Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPES
// ============================================================================

interface PendingTransaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: number | null;
  category: {
    id: number;
    name: string;
    type: TransactionType;
  } | null;
  expiresAt: string;
  isDuplicate: boolean | null;
  rawData: unknown;
}

interface PendingTransactionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

interface PendingTransactionRowProps {
  transaction: PendingTransaction;
  categories: Category[];
  onUpdate: (id: number, updates: Partial<PendingTransaction>) => Promise<void>;
  onCommit: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  isCommitting: boolean;
  isUpdating: boolean;
  isRejecting: boolean;
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function PendingTransactionRow({
  transaction,
  categories,
  onUpdate,
  onCommit,
  onReject,
  isCommitting,
  isUpdating,
  isRejecting,
  isSelected,
  onSelect,
}: PendingTransactionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(transaction.description);
  const [editAmount, setEditAmount] = useState(transaction.amount.toString());
  const [editDate, setEditDate] = useState(
    new Date(transaction.date).toISOString().split("T")[0]
  );
  const [editType, setEditType] = useState(transaction.type);
  const [editCategoryId, setEditCategoryId] = useState<string>(
    transaction.categoryId?.toString() || ""
  );

  // Filter categories by selected type
  // WHY: Only show categories compatible with selected transaction type
  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === editType),
    [categories, editType]
  );

  const handleSave = async () => {
    const updates: Partial<PendingTransaction> = {};

    if (editDescription !== transaction.description) {
      updates.description = editDescription;
    }

    if (editAmount !== transaction.amount.toString()) {
      const numericAmount = parseFloat(editAmount.replace(",", "."));
      if (!isNaN(numericAmount) && numericAmount > 0) {
        updates.amount = numericAmount;
      }
    }

    if (editDate !== new Date(transaction.date).toISOString().split("T")[0]) {
      updates.date = new Date(editDate + "T00:00:00").toISOString();
    }

    if (editType !== transaction.type) {
      updates.type = editType;
      // Reset category if it's not compatible with new type
      // WHY: Prevent invalid category-type combinations
      const currentCategory = categories.find(
        (category) => category.id === transaction.categoryId
      );
      if (currentCategory && currentCategory.type !== editType) {
        setEditCategoryId("");
        updates.categoryId = null;
      }
    }

    const newCategoryId = editCategoryId === "" ? null : parseInt(editCategoryId, 10);
    if (newCategoryId !== transaction.categoryId) {
      updates.categoryId = newCategoryId;
    }

    if (Object.keys(updates).length > 0) {
      await onUpdate(transaction.id, updates);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditDescription(transaction.description);
    setEditAmount(transaction.amount.toString());
    setEditDate(new Date(transaction.date).toISOString().split("T")[0]);
    setEditType(transaction.type);
    setEditCategoryId(transaction.categoryId?.toString() || "");
    setIsEditing(false);
  };

  const handleCommit = async () => {
    await onCommit(transaction.id);
  };

  const handleReject = async () => {
    await onReject(transaction.id);
  };

  return (
    <div className="p-3 mb-2 text-sm card-transaction rounded transition-all duration-200 hover:shadow-sm relative">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(transaction.id, e.target.checked)}
          disabled={isCommitting || isUpdating || isRejecting}
          className="mt-1 h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />

        {/* Left side - Transaction info */}
        <div className="flex-1 space-y-2 pr-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{transaction.description}</h4>
            {transaction.isDuplicate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                <Copy className="h-3 w-3" />
                Duplicate
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatCurrency(transaction.amount)}
            </span>
            <span>
              {new Date(transaction.date).toLocaleDateString()}
            </span>
            <span className="capitalize">{transaction.type.toLowerCase()}</span>
            {transaction.category && (
              <span className="text-muted-foreground">
                {transaction.category.name}
              </span>
            )}
          </div>

          {/* Inline editing */}
          {isEditing && (
            <div className="space-y-3 pt-3 border-t border-input">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={isUpdating}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Amount</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                        setEditAmount(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    disabled={isUpdating}
                    step="0.01"
                    min="0"
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    disabled={isUpdating}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => {
                      setEditType(e.target.value as TransactionType);
                      // Reset category if incompatible
                      // WHY: Prevent invalid category-type combinations
                      const currentCategory = categories.find(
                        (category) => category.id === transaction.categoryId
                      );
                      if (currentCategory && currentCategory.type !== e.target.value) {
                        setEditCategoryId("");
                      }
                    }}
                    disabled={isUpdating}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="INCOME">Income</option>
                    <option value="NEEDS">Needs</option>
                    <option value="WANTS">Wants</option>
                    <option value="INVESTMENTS">Investments</option>
                    <option value="RESERVES">Reserves</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  disabled={isUpdating || availableCategories.length === 0}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No Category</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="inline-flex h-7 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="inline-flex h-7 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Actions (Fixed to right edge) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isUpdating || isCommitting || isRejecting}
            className="p-2 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isEditing ? "Cancel editing" : "Edit inline"}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={isCommitting || isUpdating || isRejecting}
            className="p-2 rounded-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reject transaction"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={isCommitting || isUpdating || isRejecting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCommitting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PendingTransactionsManager({
  isOpen,
  onClose,
  onImportSuccess,
}: PendingTransactionsManagerProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [pendingTransactions, setPendingTransactions] = useState<
    PendingTransaction[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState<Set<number>>(new Set());
  const [isUpdating, setIsUpdating] = useState<Set<number>>(new Set());
  const [isRejecting, setIsRejecting] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------------------------------
  // Fetch Pending Transactions
  // --------------------------------------------------------------------------
  // CRITICAL: This component MUST ONLY fetch from /api/pending-transactions
  // It displays ONLY imported CSV transactions in "Limbo" (PendingTransaction model)
  // DO NOT fetch from /api/transactions (confirmed transactions) or /api/dashboard
  const fetchPendingTransactions = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // IMPORTANT: Only fetch from pending-transactions endpoint
      // This returns ONLY transactions from CSV imports that haven't been committed yet
      const response = await fetch("/api/pending-transactions", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      // Data from /api/pending-transactions is already filtered to only PendingTransaction records
      setPendingTransactions(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Failed to fetch pending transactions";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Fetch Categories
  // --------------------------------------------------------------------------
  const fetchCategories = useCallback(async () => {
    try {
      const allCategories = await categoryService.getAll();
      setCategories(allCategories);
    } catch {
      // WHY: Silently fail category fetch - component can still function without categories
      // Categories are optional for pending transactions
      // In production, errors are logged server-side via API routes
    }
  }, []);

  // --------------------------------------------------------------------------
  // Update Pending Transaction
  // --------------------------------------------------------------------------
  const handleUpdate = useCallback(
    async (id: number, updates: Partial<PendingTransaction>) => {
      setIsUpdating((prev) => new Set(prev).add(id));
      setError("");

      try {
        const csrfToken = await getCsrfToken();
        if (!csrfToken) {
          throw new Error("Failed to obtain CSRF token");
        }

        const response = await fetch(`/api/pending-transactions/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify(updates),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || `HTTP ${response.status}`,
            response.status
          );
        }

        const updated = await response.json();

        // Update local state
        setPendingTransactions((previousTransactions) =>
          previousTransactions.map((transaction) => (transaction.id === id ? updated : transaction))
        );
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Failed to update transaction";
        setError(message);
        throw error;
      } finally {
        setIsUpdating((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

  // --------------------------------------------------------------------------
  // Selection Handlers
  // --------------------------------------------------------------------------
  const handleSelect = useCallback((id: number, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === pendingTransactions.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(pendingTransactions.map((transaction) => transaction.id)));
    }
  }, [selectedIds.size, pendingTransactions]);

  // --------------------------------------------------------------------------
  // Batch Operations
  // --------------------------------------------------------------------------
  const handleBatchApprove = useCallback(async () => {
    if (selectedIds.size === 0) {
      setError("Please select at least one transaction");
      return;
    }

    setIsBatchProcessing(true);
    setError("");
    setSuccess("");

    try {
      const ids = Array.from(selectedIds);
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error("Failed to obtain CSRF token");
      }

      const response = await fetch(`/api/pending-transactions/${ids[0]}/commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ ids }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status
        );
      }

      const result = await response.json();

      // Remove committed transactions from list
      setPendingTransactions((previousTransactions) =>
        previousTransactions.filter((transaction) => !selectedIds.has(transaction.id))
      );

      setSelectedIds(new Set());
      setSuccess(
        `${result.stats?.committed || selectedIds.size} transaction(s) approved successfully!`
      );

      if (onImportSuccess) {
        onImportSuccess();
      }

      await fetchPendingTransactions();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Failed to approve transactions";
      setError(message);
    } finally {
      setIsBatchProcessing(false);
    }
  }, [selectedIds, fetchPendingTransactions, onImportSuccess]);

  const handleBatchReject = useCallback(async () => {
    if (selectedIds.size === 0) {
      setError("Please select at least one transaction");
      return;
    }

    setIsBatchProcessing(true);
    setError("");
    setSuccess("");

    try {
      const ids = Array.from(selectedIds);
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error("Failed to obtain CSRF token");
      }

      // Reject each transaction individually
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/pending-transactions/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": csrfToken,
            },
            credentials: "include",
          })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      // Remove rejected transactions from list
      setPendingTransactions((previousTransactions) =>
        previousTransactions.filter((transaction) => !selectedIds.has(transaction.id))
      );

      setSelectedIds(new Set());
      setSuccess(
        `${successful} transaction(s) rejected successfully${failed > 0 ? ` (${failed} failed)` : ""}`
      );

      await fetchPendingTransactions();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Failed to reject transactions";
      setError(message);
    } finally {
      setIsBatchProcessing(false);
    }
  }, [selectedIds, fetchPendingTransactions]);

  // --------------------------------------------------------------------------
  // Reject Pending Transaction
  // --------------------------------------------------------------------------
  const handleReject = useCallback(
    async (id: number) => {
      setIsRejecting((prev) => new Set(prev).add(id));
      setError("");
      setSuccess("");

      try {
        const csrfToken = await getCsrfToken();
        if (!csrfToken) {
          throw new Error("Failed to obtain CSRF token");
        }

        const response = await fetch(`/api/pending-transactions/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || `HTTP ${response.status}`,
            response.status
          );
        }

        // Remove rejected transaction from list
        setPendingTransactions((previousTransactions) =>
          previousTransactions.filter((transaction) => transaction.id !== id)
        );

        setSuccess("Transaction rejected successfully");
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Failed to reject transaction";
        setError(message);
      } finally {
        setIsRejecting((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

  // --------------------------------------------------------------------------
  // Commit Pending Transaction
  // --------------------------------------------------------------------------
  const handleCommit = useCallback(
    async (id: number) => {
      // Prevent rapid clicking / duplicate commits
      if (isCommitting.has(id)) {
        return;
      }
      
      setIsCommitting((prev) => {
        // Double-check to prevent race condition
        if (prev.has(id)) return prev;
        return new Set(prev).add(id);
      });
      setError("");
      setSuccess("");

      try {
        const csrfToken = await getCsrfToken();
        if (!csrfToken) {
          throw new Error("Failed to obtain CSRF token");
        }

        const response = await fetch(`/api/pending-transactions/${id}/commit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || `HTTP ${response.status}`,
            response.status
          );
        }

        const result = await response.json();

        // Remove committed transaction from list
        setPendingTransactions((previousTransactions) =>
          previousTransactions.filter((transaction) => transaction.id !== id)
        );

        setSuccess(
          `Transaction imported successfully! ${
            result.stats?.committed || 1
          } transaction(s) committed.`
        );

        // Call success callback
        if (onImportSuccess) {
          onImportSuccess();
        }

        // Auto-refresh list
        await fetchPendingTransactions();
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Failed to commit transaction";
        setError(message);
      } finally {
        setIsCommitting((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [fetchPendingTransactions, onImportSuccess, isCommitting]
  );

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      fetchPendingTransactions();
      fetchCategories();
      setError("");
      setSuccess("");
      setSelectedIds(new Set());
    }
  }, [isOpen, fetchPendingTransactions, fetchCategories]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] border-none flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Pending Transactions Manager</DialogTitle>
              <DialogDescription>
                Review and approve imported CSV transactions (Staging Area). 
                These are transactions from your import file that haven&apos;t been committed yet.
                Edit details before committing to your account.
              </DialogDescription>
            </div>
            {pendingTransactions.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap ml-4"
              >
                {selectedIds.size === pendingTransactions.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Error Message */}
        {error && (
          <div className="flex-shrink-0 p-3 rounded-md border border-destructive/50 bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex-shrink-0 p-3 rounded-md border border-green-500/50 bg-green-500/10">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-500">{success}</p>
            </div>
          </div>
        )}

        {/* Content - Scrollable Area */}
        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-md border border-input">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : pendingTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No pending transactions
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Import transactions to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
              {pendingTransactions.map((transaction) => (
                <PendingTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  categories={categories}
                  onUpdate={handleUpdate}
                  onCommit={handleCommit}
                  onReject={handleReject}
                  isCommitting={isCommitting.has(transaction.id)}
                  isUpdating={isUpdating.has(transaction.id)}
                  isRejecting={isRejecting.has(transaction.id)}
                  isSelected={selectedIds.has(transaction.id)}
                  onSelect={handleSelect}
                />
              ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 flex flex-col gap-3 pt-4 border-t">
          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={handleBatchApprove}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBatchProcessing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Approve Selected ({selectedIds.size})
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleBatchReject}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-destructive text-destructive text-xs font-medium transition-colors hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBatchProcessing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    Reject Selected ({selectedIds.size})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {pendingTransactions.length} pending transaction
              {pendingTransactions.length !== 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
