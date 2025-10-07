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

            <FinancialStatement {...financialStatement} />
        </div>
    );
}

