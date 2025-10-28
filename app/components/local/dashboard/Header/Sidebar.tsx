import { SidebarProps } from "@/app/types/dashboardTypes";
import FinancialStatement from "./financials/FinancialStatmentRow";
import MonthSelector from "./MonthSelector";


export default function Sidebar({ financialStatement, selectedDate, onMonthChange }: SidebarProps) {
    return (
        <div className="flex flex-col h-full">
            <MonthSelector
                selectedDate={selectedDate}
                onMonthChange={onMonthChange}
            />

            <FinancialStatement
                totalIncome={financialStatement.revenue}
                totalNeeds={financialStatement.fixedExpenses}
                totalWants={financialStatement.variableExpenses}
                totalReserves={financialStatement.reserves}
                investments={financialStatement.investments}
                finalBalance={financialStatement.result}
            />
        </div>
    );
}

