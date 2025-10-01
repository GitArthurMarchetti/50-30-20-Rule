import { Trash2 } from "lucide-react";
import React, { useState } from "react";

interface FinancialEntryRowProps {
  id: number;
  label: string;
  amount: number | null | undefined;
  categoryTitle: string;
  onDelete: (id: number) => void;
  isDeleting?: boolean; // Nova prop para controlar o estado visual
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

export default function FinancialEntryRow({
  id,
  label,
  amount,
  categoryTitle,
  onDelete,
  isDeleting, // Recebe a nova prop
}: FinancialEntryRowProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

  const amountColorClass = getAmountColorClass(categoryTitle);

  // Adiciona classes de estilo para o efeito de carregamento sutil
  const deletingClasses = isDeleting ? "opacity-50 pointer-events-none" : "";

  return (
    <div className={`group flex justify-between items-center p-2 mb-2 text-sm card-transaction rounded transition-opacity ${deletingClasses}`}>
      <span className="secondary-text truncate">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${amountColorClass}`}>
          {formattedAmount}
        </span>
        <button
          onClick={() => onDelete(id)}
          disabled={isDeleting} // Desabilita o botão enquanto apaga
          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          aria-label="Apagar transação"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

