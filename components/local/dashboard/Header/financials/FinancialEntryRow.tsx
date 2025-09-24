interface FinancialEntryRowProps {
    label: string;
    amount: number;
}

export default function FinancialEntryRow({ label, amount }: FinancialEntryRowProps) {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);

    return (
        <div className="flex justify-between items-center p-2 text-sm text-white">
            <span>{label}</span>
            <span className="font-medium">{formattedAmount}</span>
        </div>
    );
}