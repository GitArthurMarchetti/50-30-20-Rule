import Sidebar from "@/components/local/dashboard/Header/Sidebar";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardHeader from "@/components/local/dashboard/Header/DashboardHeader";
import FinancialCategoryCard from "@/components/local/dashboard/Header/financials/FinancialCategoryCard";
import FinancialEntryRow from "@/components/local/dashboard/Header/financials/FinancialEntryRow"; // 1. Importe o novo componente

// 2. Adicione itens de exemplo aos seus dados
const financialData = {
  income: { title: "Income", percentage: "100%", amount: "$1000,00", items: [{ label: "Salário", amount: 700 }, { label: "Freelance", amount: 300 }] },
  needs: { title: "Needs", percentage: "50%", amount: "$500,00", items: [{ label: "Aluguel", amount: 500 }] },
  wants: { title: "Wants", percentage: "30%", amount: "$300,00", items: [{ label: "Cinema", amount: 50 }, { label: "Livros", amount: 100 }] },
  reserves: { title: "Reserves", percentage: "10%", amount: "$100,00", items: [{ label: "Emergência", amount: 100 }] },
  investments: { title: "Investments", percentage: "10%", amount: "$100,00", items: [{ label: "Bitcoin", amount: 100 }] },
};

// 3. Separe os dados para facilitar a renderização do layout
const mainCategories = [financialData.income, financialData.needs, financialData.wants];
const splitCategories = [financialData.reserves, financialData.investments];

export default function Home() {
  return (
    <DashboardLayout sidebar={<Sidebar />}>
      <DashboardHeader />

      <section className="h-8/9 w-full mt-auto flex flex-row justify-evenly gap-4">

        {mainCategories.map((category) => (
          <div key={category.title} className="w-1/5 h-full">
            <FinancialCategoryCard
              title={category.title}
              percentage={category.percentage}
              amount={category.amount}
            >
              {category.items.map((item) => (
                <FinancialEntryRow key={item.label} label={item.label} amount={item.amount} />
              ))}
            </FinancialCategoryCard>
          </div>
        ))}

        <div className="w-1/5 h-full flex flex-col justify-between">
          {splitCategories.map((category) => (
            <div key={category.title} className="h-[48%] w-full">
              <FinancialCategoryCard
                title={category.title}
                percentage={category.percentage}
                amount={category.amount}
              >
                {category.items.map((item) => (
                  <FinancialEntryRow key={item.label} label={item.label} amount={item.amount} />
                ))}
              </FinancialCategoryCard>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}