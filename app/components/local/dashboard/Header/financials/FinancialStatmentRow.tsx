import { formatCurrency } from "@/app/lib/formatters";
import FinancialStatementRow from "./FinancialStatmentRowProps";

interface FinancialStatementProps {
  totalIncome: number;
  totalNeeds: number;
  totalWants: number;
  totalReserves: number;
  investments: number; 
  finalBalance: number;
}

export default function FinancialStatement({
  totalIncome,
  totalNeeds,
  totalWants,
  investments, 
  totalReserves,
  finalBalance,
}: FinancialStatementProps) {

  const isRowInBadSituation = (label: string, value: number) => {
    if (totalIncome === 0) return false;
    const percentageOfRevenue = (value / totalIncome) * 100;

    switch (label) {
      case "E. Fixed":
        return percentageOfRevenue > 50;
      case "E. Variable":
        return percentageOfRevenue > 30;
      case "Reserves":
        return percentageOfRevenue > 10;
      case "Investments":
        return percentageOfRevenue > 10;
      case "Result":
        return percentageOfRevenue < 0; 
      default:
        return false;
    }

  };

  const calculatePercentage = (value: number) => {
    if (totalIncome === 0) return "0%";
    const percentage = (value / totalIncome) * 100;
    return `${percentage.toFixed(0)}%`;
  };

  const statementData = {
    rows: [
      { label: "Revenue", amount: formatCurrency(totalIncome), percentage: "100%", isBad: false },
      {
        label: "E. Fixed",
        amount: formatCurrency(totalNeeds),
        percentage: calculatePercentage(totalNeeds),
        isBad: isRowInBadSituation("E. Fixed", totalNeeds)
      },
      {
        label: "E. Variable",
        amount: formatCurrency(totalWants),
        percentage: calculatePercentage(totalWants),
        isBad: isRowInBadSituation("E. Variable", totalWants)
      },
      {
        label: "Reserves",
        amount: formatCurrency(totalReserves),
        percentage: calculatePercentage(totalReserves),
        isBad: isRowInBadSituation("Reserves", totalReserves) 
      },
      {
        label: "Investments",
        amount: formatCurrency(investments),
        percentage: calculatePercentage(investments),
        isBad: isRowInBadSituation("Investments", investments) 
      },
    ],
    result: {
      label: "Result",
      amount: formatCurrency(finalBalance),
      percentage: calculatePercentage(finalBalance),
      isBad: isRowInBadSituation("Result", finalBalance)
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