'use client';

// Imports
import { TransactionType } from "@/app/generated/prisma";
import { formatCurrency } from "@/app/lib/formatters";
import { Trash2 } from "lucide-react";
import React from "react";
import { useState } from "react";
import { useDashboard } from "@/app/context/DashboardContex";
import TransactionEditModal from "../../../modal/TransactionsEdit";

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

const getAmountColorClass = (category: string) => {
  switch (category) {
    case "Income":
      return "text-income";
    case "Needs":
    case "Wants":
      return "text-expense";
    case "Reserves":
    case "Investments":
      return "text-saving";
    default:
      return "text-gray-200";
  }
};

export default function FinancialEntryRow(props: FinancialEntryRowProps) {
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
  const { refetchData } = useDashboard();

  // --- INÍCIO DA MUDANÇA ---
  // 3. Procura o nome da categoria no mapa
  const categoryName = categoryId ? categoryMap.get(categoryId) : null;
  // --- FIM DA MUDANÇA ---

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  const transactionData = {
    id,
    description: label,
    amount: amount ?? 0,
    date,
    type,
    categoryId
  };
  const formattedAmount = formatCurrency(amount ?? 0);
  const amountColorClass = getAmountColorClass(categoryTitle);
  const deletingClasses = isDeleting ? "opacity-50 pointer-events-none" : "";

  return (
    <>
      <div
        onClick={() => setIsEditModalOpen(true)}
        className={`group flex justify-between items-center p-2 mb-2 text-sm card-transaction rounded transition-opacity ${deletingClasses} cursor-pointer`}
      >
        <div className="h-full flex flex-col">
          <span className="secondary-text truncate">{label}</span>
          
          {/* --- INÍCIO DA MUDANÇA --- */}
          {/* 4. Exibe o nome da categoria ou um fallback */}
          <span className="secondary-text truncate text-xs"> 
            {categoryName || 'Sem Categoria'}
          </span>
          {/* --- FIM DA MUDANÇA --- */}

        </div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${amountColorClass}`}>
            {formattedAmount}
          </span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
            aria-label="Apagar transação"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <TransactionEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transaction={transactionData}
        onTransactionUpdated={() => {
          refetchData();
          setIsEditModalOpen(false);
        }}
      />
    </>
  );
}