import Sidebar from "@/components/local/dashboard/Header/Sidebar";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardHeader from "@/components/local/dashboard/Header/DashboardHeader";
import FinancialCategoryCard from "@/components/local/dashboard/Header/financials/FinancialCategoryCard";
import FinancialEntryRow from "@/components/local/dashboard/Header/financials/FinancialEntryRow";

const financialData = {
  income: { title: "Income", actualPercentage: "00%", maxPercentage: "100%", actualAmount: "00,00", maxAmount: "$1000,00", items: [{ label: "Salário", amount: 700 }, { label: "Freelance", amount: 300 }] },
  needs: { title: "Needs", actualPercentage: "00%", maxPercentage: "50%", actualAmount: "00,00", maxAmount: "$500,00", items: [{ label: "Aluguel", amount: 500 }] },
  wants: { title: "Wants", actualPercentage: "00%", maxPercentage: "30%", actualAmount: "00,00", maxAmount: "$300,00", items: [{ label: "Cinema", amount: 50 }, { label: "Livros", amount: 100 }, { label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },{ label: "Cinema", amount: 50 },] },
  reserves: { title: "Reserves", actualPercentage: "00%", maxPercentage: "10%", actualAmount: "00,00", maxAmount: "$100,00", items: [{ label: "Emergência", amount: 100 }] },
  investments: { title: "Investments", actualPercentage: "00%", maxPercentage: "10%", actualAmount: "00,00", maxAmount: "$100,00", items: [{ label: "Bitcoin", amount: 100 }] },
};

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
              maxPercentage={category.maxPercentage}
              actualPercentage={category.actualPercentage}
              actualAmount={category.actualAmount}
              maxAmount={category.maxAmount}
            >
              {category.items.map((item) => (
                <FinancialEntryRow key={item.label} label={item.label} amount={item.amount} categoryTitle={category.title}/>
              ))}
            </FinancialCategoryCard>
          </div>
        ))}

        <div className="w-1/5 h-full flex flex-col justify-between">
          {splitCategories.map((category) => (
            <div key={category.title} className="h-[48%] w-full">
              <FinancialCategoryCard
                title={category.title}
                maxPercentage={category.maxPercentage}
                actualPercentage={category.actualPercentage}
                actualAmount={category.actualAmount}
                maxAmount={category.maxAmount}
              >
                {category.items.map((item) => (
                  <FinancialEntryRow key={item.label} label={item.label} amount={item.amount} categoryTitle={category.title} />
                ))}
              </FinancialCategoryCard>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}