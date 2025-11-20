'use client'
import React, { useState } from "react";
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


const getCategoryColorClass = (category: string) => {
    switch (category) {
        case "Income": return "title-income";
        case "Needs": return "title-needs";
        case "Wants": return "title-wants";
        case "Reserves":
        case "Investments": return "title-reserves";
        default: return "title-reserves";
    }
};

export default function FinancialCategoryCard({
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
}: FinancialCategoryCardProps & { isRefreshing?: boolean }) {
    const { creatingTransaction } = useDashboard();
    const categoryColorClass = getCategoryColorClass(title);
    
    // Mostra skeleton se está criando transação ou fazendo refresh
    // (atualização e deleção são tratadas individualmente no FinancialEntryRow)
    const showSkeleton = isRefreshing || creatingTransaction;

    const actual = parseFloat(actualPercentage);
    const max = parseFloat(maxPercentage);

    const situacion = actual > max
        ? "text-expense bg-opacity-30 font-bold"
        : actual === max
            ? "text-saving bg-opacity-30 font-bold"
            : "bg-transparent text-white";

    const [showAvailable, setShowAvailable] = useState(false);
    // Shadcn dropdown handles its own open/close

    const parseCurrencyToNumber = (value: string) => {
        if (!value) return 0;
        const numeric = Number(value.replace(/[^0-9.-]/g, ""));
        return isNaN(numeric) ? 0 : numeric;
    };

    const remainingPercentage = Math.max(0, (isNaN(max) ? 0 : max) - (isNaN(actual) ? 0 : actual));
    const remainingAmountNumber = Math.max(0, parseCurrencyToNumber(maxAmount) - parseCurrencyToNumber(actualAmount));
    const remainingAmountFormatted = formatCurrency(remainingAmountNumber);


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
                                    onClick={() => setShowAvailable((v) => !v)}
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
                    <p className="text-center text-sm">{maxPercentage}</p>
                    <p className="text-center font-bold">{actualAmount}</p>
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
}
