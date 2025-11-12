import { FinancialStatementRowProps } from "@/app/types/financialsType";


export default function FinancialStatementRow({ label, amount, percentage, isTotal = false, isBad = false }: FinancialStatementRowProps) {
    // Ensure percentage is always a string and displayed
    const displayPercentage = percentage || "0%";
    
    const situationClass = isBad ? 'text-red-500 font-bold bg-red-500 bg-opacity-20 rounded-md' : '';

    const rowClasses = `w-full flex flex-row justify-between  !cursor-default transaction-background items-center p-3 rounded-sm ${isTotal ? 'h-5/6 my-auto' : ''} ${situationClass}`; 

    
    return (
        <div className={rowClasses}>
            <p className="font-bold">{label}</p>
            <p className="font-bold">{amount}</p>
            <p className="font-bold">{displayPercentage}</p>
        </div>
    );
}