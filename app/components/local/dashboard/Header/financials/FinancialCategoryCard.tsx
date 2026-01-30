'use client'
import React, { useState, useMemo, useCallback, memo } from "react";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import AddTransactionButton from "../../../modal/TransactionButton";
import { ScrollArea } from "@/components/ui/scroll-area"
import { FinancialCategoryCardProps } from "@/app/types/financialsType";
import { formatCurrency } from "@/app/lib/formatters";
import FinancialEntryRowSkeleton from "./FinancialEntryRowSkeleton";
import { useDashboard } from "@/app/context/DashboardContex";


// OTIMIZAÇÃO: Usar Map para O(1) lookup
const CATEGORY_COLOR_MAP: Record<string, string> = {
    "Income": "title-income",
    "Needs": "title-needs",
    "Wants": "title-wants",
    "Reserves": "title-reserves",
    "Investments": "title-reserves",
};

const getCategoryColorClass = (category: string): string => {
    return CATEGORY_COLOR_MAP[category] || "title-reserves";
};

// OTIMIZAÇÃO: Memoizar componente
const FinancialCategoryCard = memo(function FinancialCategoryCard({
    title,
    categoryType,
    maxPercentage,
    actualPercentage,
    maxAmount,
    actualAmount,
    children,
    onTransactionAdded,
    selectedDate,
    isRefreshing,
    monthlyIncome,
}: FinancialCategoryCardProps & { isRefreshing?: boolean }) {
    const { creatingTransaction } = useDashboard();
    
    // OTIMIZAÇÃO: Memoizar cálculos
    const actual = useMemo(() => parseFloat(actualPercentage), [actualPercentage]);
    const max = useMemo(() => parseFloat(maxPercentage), [maxPercentage]);

    const situacion = useMemo(() => {
        if (actual > max) return "text-expense bg-opacity-30 font-bold";
        if (actual === max) return "text-saving bg-opacity-30 font-bold";
        return "bg-transparent text-white";
    }, [actual, max]);

    const [showAvailable, setShowAvailable] = useState(false);

    // OTIMIZAÇÃO: Memoizar função de parse
    const parseCurrencyToNumber = useCallback((value: string): number => {
        if (!value) return 0;
        const numeric = Number(value.replace(/[^0-9.-]/g, ""));
        return isNaN(numeric) ? 0 : numeric;
    }, []);

    // OTIMIZAÇÃO: Memoizar cálculos de remaining
    const remainingPercentage = useMemo(() => 
        Math.max(0, (isNaN(max) ? 0 : max) - (isNaN(actual) ? 0 : actual)),
        [max, actual]
    );

    const remainingAmountNumber = useMemo(() => {
        const maxNum = parseCurrencyToNumber(maxAmount);
        const actualNum = parseCurrencyToNumber(actualAmount);
        return Math.max(0, maxNum - actualNum);
    }, [maxAmount, actualAmount, parseCurrencyToNumber]);

    const remainingAmountFormatted = useMemo(
        () => formatCurrency(remainingAmountNumber),
        [remainingAmountNumber]
    );

    const categoryColorClass = useMemo(() => getCategoryColorClass(title), [title]);
    const showSkeleton = useMemo(() => isRefreshing || creatingTransaction, [isRefreshing, creatingTransaction]);

    const toggleShowAvailable = useCallback(() => {
        setShowAvailable(v => !v);
    }, []);


    return (
        <div className="secondary-background flex flex-col h-full w-full rounded-lg overflow-hidden">
            <div className="pt-5 pb-5 flex items-center flex-shrink-0 w-full">
                <div className="w-10 flex justify-start pl-2">
                    {title !== "Income" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="p-2 rounded hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
                                    aria-label="Open menu"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="bottom" className="min-w-[180px]">
                                <DropdownMenuItem
                                    onClick={toggleShowAvailable}
                                    className="text-xs"
                                >
                                    {showAvailable ? "Show summary" : "Show available to spend"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <h1 className={`title flex-1 text-center ${categoryColorClass}`}>{title}</h1>
                <div className="w-10 flex justify-end pr-2">
                    <AddTransactionButton
                        categoryType={categoryType}
                        onTransactionAdded={onTransactionAdded}
                        selectedDate={selectedDate}
                    />
                </div>
            </div>

            <div className="flex-grow min-h-0">
                <ScrollArea className="h-full w-full">
                    <div className="p-2">
                        {showSkeleton ? (
                            // Mostrar skeleton para cada item existente ou um número mínimo
                            Array.from({ length: React.Children.count(children) || 3 }).map((_, i) => (
                                <FinancialEntryRowSkeleton key={`skeleton-${i}`} />
                            ))
                        ) : (
                            children
                        )}
                    </div>
                </ScrollArea>
            </div>

            {title === "Income" ? (
                <div className="flex flex-col flex-shrink-0 text-white p-2 border-t">
                    {monthlyIncome !== undefined ? (
                        <>
                            <p className="text-center text-xs text-gray-400">Monthly Income (Base for Goals)</p>
                            <p className="text-center font-bold">{formatCurrency(monthlyIncome)}</p>
                        </>
                    ) : (
                        <>
                            <p className="text-center text-sm">{maxPercentage}</p>
                            <p className="text-center font-bold">{actualAmount}</p>
                        </>
                    )}
                </div>
            ) : (
                <div className={`border-t flex flex-col flex-shrink-0 ${situacion} transition-colors duration-300`}>
                    {showAvailable ? (
                        <div className="w-full flex flex-col items-center justify-center gap-1 p-2">
                            <p className="text-center text-xs">Available to spend</p>
                            <div className="flex flex-row justify-center items-center gap-5">
                                <p className="text-center text-base font-bold">{remainingAmountFormatted}</p>
                                <p className="text-center text-xs">{`${Math.round(remainingPercentage)}%`}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-full flex flex-row justify-center items-center p-1">
                                <p className="text-center w-1/2 text-sm">{actualPercentage}</p>
                                <p className="text-center w-1/2 font-bold text-sm">{maxPercentage}</p>
                            </div>
                            <div className="w-full flex flex-row justify-center items-center p-1">
                                <p className="text-center w-1/2 text-sm">{actualAmount}</p>
                                <p className="text-center w-1/2 font-bold text-sm">{maxAmount}</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

FinancialCategoryCard.displayName = 'FinancialCategoryCard';

export default FinancialCategoryCard;
