import { SidebarProps } from "@/app/types/dashboardTypes";
import FinancialStatement from "./financials/FinancialStatmentRow";
import FinancialStatementSkeleton from "./financials/FinancialStatementSkeleton";
import MonthSelector from "./MonthSelector";


export default function Sidebar({ 
    financialStatement, 
    selectedDate, 
    onMonthChange,
    onYearChange,
    isRefreshing 
}: SidebarProps & { isRefreshing?: boolean }) {
    return (
        <div className="flex flex-col h-full w-full secondary-background">
            <MonthSelector
                selectedDate={selectedDate}
                onMonthChange={onMonthChange}
                onYearChange={onYearChange}
            />

            {isRefreshing ? (
                <FinancialStatementSkeleton />
            ) : (
                <FinancialStatement
                    totalIncome={financialStatement.revenue}
                    totalNeeds={financialStatement.fixedExpenses}
                    totalWants={financialStatement.variableExpenses}
                    totalReserves={financialStatement.reserves}
                    investments={financialStatement.investments}
                    finalBalance={financialStatement.result}
                />
            )}
        </div>
    );
}

