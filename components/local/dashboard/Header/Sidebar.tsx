import FinancialStatement from "./financials/FinancialStatmentRow";
import MonthSelector from "./MonthSelector";

export default function Sidebar() {
    return (
        <div className="flex flex-col h-full">
            <MonthSelector />
            <FinancialStatement />
        </div>
    );
}