'use client';

// Imports
import { TransactionType } from "@/app/generated/prisma";
import { formatCurrency } from "@/app/lib/formatters";
import { Trash2 } from "lucide-react";
import React, { useState, useMemo, useCallback, memo } from "react";
import { useDashboard } from "@/app/context/DashboardContex";
import dynamic from "next/dynamic";
import FinancialEntryRowSkeleton from "./FinancialEntryRowSkeleton";

// OPTIMIZATION: Lazy load heavy modal
const TransactionEditModal = dynamic(
  () => import("../../../modal/TransactionsEdit"),
  { ssr: false }
);

interface FinancialEntryRowProps {
  id: number;
  label: string;
  amount: number | null | undefined;
  categoryTitle: string; // Kept for color
  onDelete: (id: number) => void;
  isDeleting?: boolean;
  date: string | Date;
  type: TransactionType;
  categoryId: number | null;
  
  // --- START OF CHANGE ---
  categoryMap: Map<number, string>; // 1. Receives the map
  // --- END OF CHANGE ---
}

// OPTIMIZATION: Move function outside component and use Map for O(1) lookup
const COLOR_MAP: Record<string, string> = {
  "Income": "text-income",
  "Needs": "text-expense",
  "Wants": "text-expense",
  "Reserves": "text-saving",
  "Investments": "text-saving",
};

const getAmountColorClass = (category: string): string => {
  return COLOR_MAP[category] || "text-gray-200";
};

// OPTIMIZATION: Memoize component to avoid unnecessary re-renders
const FinancialEntryRow = memo(function FinancialEntryRow(props: FinancialEntryRowProps) {
  // Destructure ALL props
  const {
    id,
    label,
    amount,
    categoryTitle,
    onDelete,
    isDeleting,
    date,
    type,
    categoryId,

    // --- START OF CHANGE ---
    categoryMap // 2. Gets the map from props
    // --- END OF CHANGE ---
  } = props;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { refetchData, updatingIds } = useDashboard();
  
  // OPTIMIZATION: Memoize computed values (BEFORE early return)
  const isUpdating = useMemo(() => updatingIds.includes(id), [updatingIds, id]);
  
  // OPTIMIZATION: Memoize categoryName lookup
  const categoryName = useMemo(
    () => categoryId ? categoryMap.get(categoryId) : null,
    [categoryId, categoryMap]
  );

  // OPTIMIZATION: Memoize handlers
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  }, [onDelete, id]);

  const handleOpenModal = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleTransactionUpdated = useCallback(() => {
    refetchData();
    setIsEditModalOpen(false);
  }, [refetchData]);

  // OPTIMIZATION: Memoize transactionData
  const transactionData = useMemo(() => ({
    id,
    description: label,
    amount: amount ?? 0,
    date,
    type,
    categoryId
  }), [id, label, amount, date, type, categoryId]);

  // OPTIMIZATION: Memoize formatted values
  const formattedAmount = useMemo(() => formatCurrency(amount ?? 0), [amount]);
  const amountColorClass = useMemo(() => getAmountColorClass(categoryTitle), [categoryTitle]);
  const deletingClasses = useMemo(() => isDeleting ? "opacity-50 pointer-events-none" : "", [isDeleting]);
  
  // If deleting or updating, show skeleton (AFTER all hooks)
  if (isDeleting || isUpdating) {
    return <FinancialEntryRowSkeleton />;
  }

  return (
    <>
      <div
        onClick={handleOpenModal}
        className={`group flex justify-between items-start p-2 mb-2 text-sm  card-transaction rounded transition-opacity ${deletingClasses} cursor-pointer min-w-0`}
      >
        <div className="flex-1 min-w-0 flex flex-col pr-2">
          <span className="secondary-text line-clamp-2 break-words">{label}</span>
          
          <span className="secondary-text truncate text-xs mt-1"> 
            {categoryName || 'No Category'}
          </span>

        </div>
        <div className="flex items-center gap-2 flex-shrink-0 self-center">
          <span className={`font-medium ${amountColorClass} whitespace-nowrap`}>
            {formattedAmount}
          </span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-7 w-7 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer z-10 flex-shrink-0"
            aria-label="Delete transaction"
          >
            <Trash2 size={14} className="transition-transform duration-200 group-hover:scale-110" />
          </button>
        </div>
      </div>

      <TransactionEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        transaction={transactionData}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </>
  );
});

// OPTIMIZATION: Define custom comparison function for memo
FinancialEntryRow.displayName = 'FinancialEntryRow';

export default FinancialEntryRow;