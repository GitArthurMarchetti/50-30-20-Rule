// FinancialEntryRow.tsx

import React from "react";

interface FinancialEntryRowProps {
    label: string;
    amount: number;
    categoryTitle: string;
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
            return "text-white"; 
    }
};

export default function FinancialEntryRow({ label, amount, categoryTitle }: FinancialEntryRowProps) {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'CAD',
    }).format(amount);

    const amountColorClass = getAmountColorClass(categoryTitle);

    return (
        <div className="flex justify-between items-center p-2 mb-2 text-sm card-transaction">
            <span className="secondary-text">{label}</span>
            <span className={`font-medium ${amountColorClass}`}>
                {formattedAmount}
            </span>
        </div>
    );
}