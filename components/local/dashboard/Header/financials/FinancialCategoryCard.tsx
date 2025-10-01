import { TransactionType } from "@/app/generated/prisma";
import AddTransactionButton from "@/components/local/TransactionButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface FinancialCategoryCardProps {
    title: string;
    maxPercentage: string;
    actualPercentage: string;
    maxAmount: string;
    actualAmount: string;
    children: React.ReactNode;
    categoryType: TransactionType;
    onTransactionAdded: () => void;
}

const getCategoryColorClass = (category: string) => {
    switch (category) {
        case "Income":
            return "title-income";
        case "Needs":
            return "title-needs";
        case "Wants":
            return "title-wants";
        case "Reserves":
        case "Investments":
            return "title-reserves";
        default:
            return "title-reserves";
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
}: FinancialCategoryCardProps) {

    const categoryColorClass = getCategoryColorClass(title);


    return (
        <div className="secondary-background flex flex-col h-full w-full rounded-lg overflow-hidden">
            {/* 1. Header Card */}
            <div className="pt-5 pb-5 flex justify-center items-center flex-shrink-0">
                <h1 className={`title ${categoryColorClass}`}>{title}</h1>
                <AddTransactionButton categoryType={categoryType} onTransactionAdded={onTransactionAdded}
                />
            </div>

            {/* 2. Scroll Area */}
            <div className="flex-grow min-h-0">
                <ScrollArea className="h-full w-full">
                    <div className="p-2">
                        {children}
                    </div>
                </ScrollArea>
            </div>

            {title === "Income" ? (
                <div className="flex flex-col flex-shrink-0 text-white p-2 border-t">
                    <p className="text-center text-sm">{maxPercentage}</p>
                    <p className="text-center font-bold">{actualAmount}</p>
                </div>


            ) : (

                <div className="border-t flex flex-col flex-shrink-0">
                    <div className="w-full flex flex-row justify-center items-center p-1">
                        <p className="text-center w-1/2 text-sm">{actualPercentage}</p>
                        <p className="text-center w-1/2 font-bold text-sm">{maxPercentage}</p>
                    </div>
                    <div className="w-full flex flex-row justify-center items-center p-1">
                        <p className="text-center w-1/2 text-sm">{actualAmount}</p>
                        <p className="text-center w-1/2 font-bold text-sm">{maxAmount}</p>
                    </div>
                </div>
            )}
        </div>
    );
}