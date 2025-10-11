import { formatCurrency } from "@/app/lib/formatters";
import FinancialStatementRow from "./FinancialStatmentRowProps";
interface FinancialStatementProps {
  revenue: number;
  fixedExpenses: number;
  variableExpenses: number;
  reserves: number;
  result: number;
}

export default function FinancialStatement({
  revenue,
  fixedExpenses,
  variableExpenses,
  reserves,
  result,
}: FinancialStatementProps) {

  const isRowInBadSituation = (label: string, value: number) => {
    if (revenue === 0) return false;
    const percentageOfRevenue = (value / revenue) * 100;

    switch (label) {
      case "E. Fixed":
        return percentageOfRevenue > 50;
      case "E. Variable":
        return percentageOfRevenue > 30;
      case "Result":
        return percentageOfRevenue < 0;
      default:
        return false;
    }
  };

  const calculatePercentage = (value: number) => {
    if (revenue === 0) return "0%";
    const percentage = (value / revenue) * 100;
    return `${percentage.toFixed(0)}%`;
  };

  const statementData = {
    rows: [
      { label: "Revenue", amount: formatCurrency(revenue), percentage: "100%", isBad: false }, // Receita nunca é "ruim"
      {
        label: "E. Fixed",
        amount: formatCurrency(fixedExpenses),
        percentage: calculatePercentage(fixedExpenses),
        isBad: isRowInBadSituation("E. Fixed", fixedExpenses) 
      },
      {
        label: "E. Variable",
        amount: formatCurrency(variableExpenses),
        percentage: calculatePercentage(variableExpenses),
        isBad: isRowInBadSituation("E. Variable", variableExpenses) 
      },
      {
        label: "Reserves",
        amount: formatCurrency(reserves),
        percentage: calculatePercentage(reserves),
        isBad: isRowInBadSituation("Reserves", reserves)
      },
    ],
    result: {
      label: "Result",
      amount: formatCurrency(result),
      percentage: calculatePercentage(result),
      isBad: isRowInBadSituation("E. Variable", variableExpenses) 
    },
  };

  return (
    <section className="h-4/9 w-full mb-auto flex flex-col gap-4 mt-5">
      <div className="h-1/6 flex justify-center">
        <h1 className="title m-auto text-center">Financial Statement</h1>
      </div>
      <div className="h-4/6 flex flex-col justify-evenly">

        {statementData.rows.map((row) => (
          <FinancialStatementRow
            key={row.label}
            label={row.label}
            amount={row.amount}
            percentage={row.percentage}
            isBad={row.isBad}
          />
        ))}
      </div>
      <div className="h-1/6 flex justify-center">
        <FinancialStatementRow
          label={statementData.result.label}
          amount={statementData.result.amount}
          percentage={statementData.result.percentage}
          isTotal={true}
          isBad={statementData.result.isBad}
        />
      </div>
    </section>
  );
}
