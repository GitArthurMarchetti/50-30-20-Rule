import { TransactionType } from "../generated/prisma";

export interface TransactionItem {
  id: number;
  description: string;
  amount: number;
  date: Date;
  type: TransactionType; 
  categoryId: number | null; 
}

export interface FinancialCategory {
  title: string;
  type: TransactionType;
  actualPercentage: string;
  maxPercentage: string;
  actualAmount: string;
  maxAmount: string;
  items: TransactionItem[];
}

export interface DashboardData {
  cards: {
    income: FinancialCategory;
    needs: FinancialCategory;
    wants: FinancialCategory;
    reserves: FinancialCategory;
    investments: FinancialCategory;
  };
  financialStatement: {
    revenue: number;
    fixedExpenses: number;
    variableExpenses: number;
    reserves: number;
    result: number;
  };
  lastMonthsResult: number;
}


export interface SidebarProps {
  financialStatement: {
    revenue: number;
    fixedExpenses: number;
    variableExpenses: number;
    reserves: number;
    result: number;
  };
  selectedDate: Date;
  onMonthChange: (monthIndex: number) => void;
}


// Re-exporte o tipo do Prisma para usar de um só lugar
export { TransactionType };