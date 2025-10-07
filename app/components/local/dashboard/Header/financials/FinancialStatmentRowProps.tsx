import { FinancialStatementRowProps } from "@/app/types/financialsType";


export default function FinancialStatementRow({ label, amount, percentage, isTotal = false }: FinancialStatementRowProps) {

    const rowClasses = `w-full flex flex-row justify-between card-transaction items-center ${isTotal ? 'h-5/6 my-auto' : ''}`;

    return (
        <div className={rowClasses}>
            <p className="font-bold">{label}</p>
            <p className="font-bold">{amount}</p>
            <p className="font-bold">{percentage}</p>
        </div>
    );
}