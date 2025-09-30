import FinancialStatementRow from "./FinancialStatmentRowProps";

const statementData = {
    rows: [
        { label: "Revenue", amount: "$100,00", percentage: "100%" },
        { label: "E. Fixed", amount: "$100,00", percentage: "100%" },
        { label: "E. Variable", amount: "$100,00", percentage: "100%" },
        { label: "Reserves", amount: "$100,00", percentage: "100%" },
    ],
    result: { label: "Result", amount: "$100,00", percentage: "100%" },
};

export default function FinancialStatement() {
    return (

        <section className="h-4/9 w-full mb-auto flex flex-col gap-4 mt-5">

            {/* Title */}
            <div className="h-1/6 flex justify-center">
                <h1 className="title m-auto text-center">
                    Financial Statement
                </h1>
            </div>

            {/* Itens List */}
            <div className="h-4/6 flex flex-col justify-evenly">
                {statementData.rows.map((row) => (
                    <FinancialStatementRow
                        key={row.label}
                        label={row.label}
                        amount={row.amount}
                        percentage={row.percentage}
                    />
                ))}
            </div>

            {/* Total/Results */}
            <div className="h-1/6 flex justify-center">
                <FinancialStatementRow
                    label={statementData.result.label}
                    amount={statementData.result.amount}
                    percentage={statementData.result.percentage}
                    isTotal={true}
                />
            </div>

        </section>
    );
}