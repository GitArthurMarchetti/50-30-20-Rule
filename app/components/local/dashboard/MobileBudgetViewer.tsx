"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/app/lib/formatters";
import { DashboardData } from "@/app/types/dashboardTypes";

interface MobileBudgetViewerProps {
  data: DashboardData;
}

interface BudgetRow {
  label: string;
  type: "INCOME" | "NEEDS" | "WANTS" | "RESERVES" | "INVESTMENTS";
  spent: number;
  max: number;
  percentage: number;
  remaining: number;
  isIncome: boolean;
}

export default function MobileBudgetViewer({ data }: MobileBudgetViewerProps) {
  const budgetRows = useMemo<BudgetRow[]>(() => {
    const { cards } = data;
    const monthlyIncome = cards.income.monthlyIncome || 0;

    const parseCurrency = (value: string): number => {
      const numeric = Number(value.replace(/[^0-9.-]/g, ""));
      return isNaN(numeric) ? 0 : numeric;
    };

    return [
      {
        label: "Income",
        type: "INCOME",
        spent: monthlyIncome,
        max: monthlyIncome,
        percentage: 100,
        remaining: 0,
        isIncome: true,
      },
      {
        label: "Needs",
        type: "NEEDS",
        spent: parseCurrency(cards.needs.actualAmount),
        max: parseCurrency(cards.needs.maxAmount),
        percentage: parseFloat(cards.needs.actualPercentage.replace(",", ".")) || 0,
        remaining: Math.max(0, parseCurrency(cards.needs.maxAmount) - parseCurrency(cards.needs.actualAmount)),
        isIncome: false,
      },
      {
        label: "Wants",
        type: "WANTS",
        spent: parseCurrency(cards.wants.actualAmount),
        max: parseCurrency(cards.wants.maxAmount),
        percentage: parseFloat(cards.wants.actualPercentage.replace(",", ".")) || 0,
        remaining: Math.max(0, parseCurrency(cards.wants.maxAmount) - parseCurrency(cards.wants.actualAmount)),
        isIncome: false,
      },
      {
        label: "Reserves",
        type: "RESERVES",
        spent: parseCurrency(cards.reserves.actualAmount),
        max: parseCurrency(cards.reserves.maxAmount),
        percentage: parseFloat(cards.reserves.actualPercentage.replace(",", ".")) || 0,
        remaining: Math.max(0, parseCurrency(cards.reserves.maxAmount) - parseCurrency(cards.reserves.actualAmount)),
        isIncome: false,
      },
      {
        label: "Investments",
        type: "INVESTMENTS",
        spent: parseCurrency(cards.investments.actualAmount),
        max: parseCurrency(cards.investments.maxAmount),
        percentage: parseFloat(cards.investments.actualPercentage.replace(",", ".")) || 0,
        remaining: Math.max(0, parseCurrency(cards.investments.maxAmount) - parseCurrency(cards.investments.actualAmount)),
        isIncome: false,
      },
    ];
  }, [data]);

  const getTypeColor = (type: BudgetRow["type"]): string => {
    switch (type) {
      case "INCOME":
        return "text-green-400";
      case "NEEDS":
        return "text-blue-400";
      case "WANTS":
        return "text-purple-400";
      case "RESERVES":
        return "text-yellow-400";
      case "INVESTMENTS":
        return "text-yellow-400";
      default:
        return "text-white";
    }
  };

  const getRemainingColor = (remaining: number, max: number): string => {
    if (remaining === 0) return "text-muted-foreground";
    const percentage = max > 0 ? (remaining / max) * 100 : 0;
    if (percentage > 50) return "text-green-400 font-bold";
    if (percentage > 25) return "text-yellow-400 font-semibold";
    return "text-orange-400 font-semibold";
  };

  const getTargetPercentage = (type: BudgetRow["type"]): string => {
    switch (type) {
      case "INCOME":
        return "100%";
      case "NEEDS":
        return "50%";
      case "WANTS":
        return "30%";
      case "RESERVES":
        return "10%";
      case "INVESTMENTS":
        return "10%";
      default:
        return "0%";
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-3 sm:space-y-4 md:space-y-5">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8">Budget Overview</h1>
      
      {budgetRows.map((row) => (
        <div
          key={row.type}
          className="w-full transaction-background rounded-lg p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3"
        >
          {/* Header: Label + Percentage */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className={`text-base sm:text-lg md:text-xl font-semibold ${getTypeColor(row.type)}`}>
              {row.label}
            </h3>
            <span className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {row.percentage.toFixed(1)}% / {getTargetPercentage(row.type)}
            </span>
          </div>

          {/* Amounts */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm md:text-base">
              <span className="text-muted-foreground">
                {row.isIncome ? "Earned:" : "Spent:"}
              </span>
              <span className="font-medium">{formatCurrency(row.spent)}</span>
            </div>

            {!row.isIncome && (
              <>
                <div className="flex justify-between text-xs sm:text-sm md:text-base">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">{formatCurrency(row.max)}</span>
                </div>

                {/* Remaining - DESTAQUE PRINCIPAL */}
                <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm md:text-base font-medium">Available:</span>
                    <span className={`text-base sm:text-lg md:text-xl font-bold ${getRemainingColor(row.remaining, row.max)}`}>
                      {formatCurrency(row.remaining)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Result Summary */}
      <div className="w-full transaction-background rounded-lg p-3 sm:p-4 md:p-5 mt-4 sm:mt-6 md:mt-8">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold">Balance</h3>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm md:text-base text-muted-foreground">Remaining:</span>
          <span
            className={`text-lg sm:text-xl md:text-2xl font-bold ${
              data.financialStatement.result >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {formatCurrency(data.financialStatement.result)}
          </span>
        </div>
      </div>
    </div>
  );
}
