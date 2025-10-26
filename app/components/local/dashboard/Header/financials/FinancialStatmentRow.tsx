import { formatCurrency } from "@/app/lib/formatters";
// O nome do arquivo original era FinancialStatmentRow.tsx, 
// mas o import sugere que o componente FinancialStatementRow
// está em *outro* arquivo (FinancialStatmentRowProps.tsx).
// Assumindo que o nome do arquivo que você colou está correto:
import FinancialStatementRow from "./FinancialStatmentRowProps";

interface FinancialStatementProps {
  totalIncome: number;
  totalNeeds: number;
  totalWants: number;
  totalReserves: number;
  finalBalance: number;
}

export default function FinancialStatement({
  totalIncome,
  totalNeeds,
  totalWants,
  totalReserves,
  finalBalance,
}: FinancialStatementProps) {

  const isRowInBadSituation = (label: string, value: number) => {
    // CORRIGIDO: de revenue para totalIncome
    if (totalIncome === 0) return false;
    const percentageOfRevenue = (value / totalIncome) * 100;

    switch (label) {
      case "E. Fixed":
        return percentageOfRevenue > 50;
      case "E. Variable":
        return percentageOfRevenue > 30;
      case "Result":
        return percentageOfRevenue < 0; // Verifica se o resultado é negativo
      default:
        return false;
    }
  };

  const calculatePercentage = (value: number) => {
    // CORRIGIDO: de revenue para totalIncome
    if (totalIncome === 0) return "0%";
    const percentage = (value / totalIncome) * 100;
    return `${percentage.toFixed(0)}%`;
  };

  const statementData = {
    rows: [
      // CORRIGIDO: de revenue para totalIncome
      { label: "Revenue", amount: formatCurrency(totalIncome), percentage: "100%", isBad: false },
      {
        label: "E. Fixed",
        // CORRIGIDO: de fixedExpenses para totalNeeds
        amount: formatCurrency(totalNeeds),
        percentage: calculatePercentage(totalNeeds),
        isBad: isRowInBadSituation("E. Fixed", totalNeeds)
      },
      {
        label: "E. Variable",
        // CORRIGIDO: de variableExpenses para totalWants
        amount: formatCurrency(totalWants),
        percentage: calculatePercentage(totalWants),
        isBad: isRowInBadSituation("E. Variable", totalWants)
      },
      {
        label: "Reserves",
        // CORRIGIDO: de reserves para totalReserves
        amount: formatCurrency(totalReserves),
        percentage: calculatePercentage(totalReserves),
        isBad: isRowInBadSituation("Reserves", totalReserves) // A regra 'Reserves' não está definida em isRowInBadSituation, sempre será 'false'
      },
    ],
    result: {
      label: "Result",
      // CORRIGIDO: de result para finalBalance
      amount: formatCurrency(finalBalance),
      percentage: calculatePercentage(finalBalance),
      // CORRIGIDO: Bug lógico e nomes de variáveis
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