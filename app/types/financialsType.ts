import { TransactionType } from "./dashboardTypes";

export interface FinancialCategoryCardProps {
    title: string;
    maxPercentage: string;
    actualPercentage: string;
    maxAmount: string;
    actualAmount: string;
    children: React.ReactNode;
    categoryType: TransactionType;
    onTransactionAdded: () => void;
    selectedDate: Date; // 1. Adicionamos a prop que estava faltando
}

export interface FinancialStatementRowProps {
    label: string;
    amount: string;
    percentage: string;
    isTotal?: boolean; 
}