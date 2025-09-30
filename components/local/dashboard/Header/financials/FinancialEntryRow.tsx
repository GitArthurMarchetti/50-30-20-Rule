// components/local/dashboard/Header/financials/FinancialEntryRow.tsx

import React from "react";

interface FinancialEntryRowProps {
  label: string;
  amount: number | null | undefined;
  categoryTitle: string;
}

const getAmountColorClass = (category: string) => {
  switch (category) {
    case "Income":
      return "text-income";       // ex.: verde
    case "Needs":
    case "Wants":
      return "text-expense";      // ex.: vermelho
    case "Reserves":
    case "Investments":
      return "text-saving";       // ex.: azul
    default:
      return "text-gray-200";     // fallback
  }
};

export default function FinancialEntryRow({
  label,
  amount,
  categoryTitle,
}: FinancialEntryRowProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

  const amountColorClass = getAmountColorClass(categoryTitle);

  return (
    <div className="flex justify-between items-center p-2 mb-2 text-sm card-transaction">
      <span className="secondary-text truncate">{label}</span>
      <span className={`font-medium ${amountColorClass}`}>
        {formattedAmount}
      </span>
    </div>
  );
}
