'use client';

// Imports
import { TransactionType } from "@/app/generated/prisma";
import { formatCurrency } from "@/app/lib/formatters";
import { Trash2 } from "lucide-react";
import React, { useState, useMemo, useCallback, memo } from "react";
import { useDashboard } from "@/app/context/DashboardContex";
import dynamic from "next/dynamic";
import FinancialEntryRowSkeleton from "./FinancialEntryRowSkeleton";

// OTIMIZAÇÃO: Lazy load modal pesado
const TransactionEditModal = dynamic(
  () => import("../../../modal/TransactionsEdit"),
  { ssr: false }
);

interface FinancialEntryRowProps {
  id: number;
  label: string;
  amount: number | null | undefined;
  categoryTitle: string; // Mantemos para a cor
  onDelete: (id: number) => void;
  isDeleting?: boolean;
  date: string | Date;
  type: TransactionType;
  categoryId: number | null;
  
  // --- INÍCIO DA MUDANÇA ---
  categoryMap: Map<number, string>; // 1. Recebe o mapa
  // --- FIM DA MUDANÇA ---
}

// OTIMIZAÇÃO: Mover função para fora do componente e usar Map para O(1) lookup
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

// OTIMIZAÇÃO: Memoizar componente para evitar re-renders desnecessários
const FinancialEntryRow = memo(function FinancialEntryRow(props: FinancialEntryRowProps) {
  // Destruturamos TODAS as props
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

    // --- INÍCIO DA MUDANÇA ---
    categoryMap // 2. Pega o mapa das props
    // --- FIM DA MUDANÇA ---
  } = props;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { refetchData, updatingIds } = useDashboard();
  
  // OTIMIZAÇÃO: Memoizar valores computados (ANTES do early return)
  const isUpdating = useMemo(() => updatingIds.includes(id), [updatingIds, id]);
  
  // OTIMIZAÇÃO: Memoizar categoryName lookup
  const categoryName = useMemo(
    () => categoryId ? categoryMap.get(categoryId) : null,
    [categoryId, categoryMap]
  );

  // OTIMIZAÇÃO: Memoizar handlers
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

  // OTIMIZAÇÃO: Memoizar transactionData
  const transactionData = useMemo(() => ({
    id,
    description: label,
    amount: amount ?? 0,
    date,
    type,
    categoryId
  }), [id, label, amount, date, type, categoryId]);

  // OTIMIZAÇÃO: Memoizar valores formatados
  const formattedAmount = useMemo(() => formatCurrency(amount ?? 0), [amount]);
  const amountColorClass = useMemo(() => getAmountColorClass(categoryTitle), [categoryTitle]);
  const deletingClasses = useMemo(() => isDeleting ? "opacity-50 pointer-events-none" : "", [isDeleting]);
  
  // Se está deletando ou atualizando, mostra skeleton (DEPOIS de todos os hooks)
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
            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10 flex-shrink-0"
            aria-label="Apagar transação"
          >
            <Trash2 size={14} />
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

// OTIMIZAÇÃO: Definir função de comparação customizada para memo
FinancialEntryRow.displayName = 'FinancialEntryRow';

export default FinancialEntryRow;