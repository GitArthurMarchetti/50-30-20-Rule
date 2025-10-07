"use client";

import DashboardLayout from "./layout/DashboardLayout";
import Sidebar from "./components/local/dashboard/Header/Sidebar";
import DashboardHeader from "./components/local/dashboard/Header/DashboardHeader";
import FinancialCategoryCard from "./components/local/dashboard/Header/financials/FinancialCategoryCard";
import FinancialEntryRow from "./components/local/dashboard/Header/financials/FinancialEntryRow";
import { DashboardProvider, useDashboard } from "./context/DashboardContex";


function DashboardContent() {

  const { 
    isLoading, 
    error, 
    data, 
    selectedDate, 
    includeResult,
    deletingIds,
    handleMonthChange, 
    handleToggleResult, 
    refetchData, 
    handleDeleteTransaction 
  } = useDashboard();


  if (isLoading || !data) {
    return <p className="text-white text-center mt-10">Carregando...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-10">Erro: {error}</p>;
  }

  const { income, needs, wants, reserves, investments } = data.cards;
  const mainCategories = [income, needs, wants];
  const splitCategories = [reserves, investments];

  return (
    <DashboardLayout 
      sidebar={
        <Sidebar 
          selectedDate={selectedDate} 
          onMonthChange={handleMonthChange} 
          financialStatement={data.financialStatement} 
        />
      }
    >
      <DashboardHeader
        lastMonthsResult={data.lastMonthsResult}
        isResultIncluded={includeResult}
        onToggleResult={handleToggleResult}
      />
      <section className="h-8/9 w-full mt-auto flex flex-row justify-evenly gap-4">
        {mainCategories.map((category) => (
          <div key={category.title} className="w-1/5 h-full">
            <FinancialCategoryCard
              {...category}
              categoryType={category.type}
              onTransactionAdded={refetchData}
              selectedDate={selectedDate}
            >
              {category.items.map((item) => (
                <FinancialEntryRow
                  key={item.id}
                  id={item.id}
                  label={item.description}
                  amount={item.amount}
                  categoryTitle={category.title}
                  onDelete={handleDeleteTransaction} 
                  isDeleting={deletingIds.includes(item.id)}
                />
              ))}
            </FinancialCategoryCard>
          </div>
        ))}
        <div className="w-1/5 h-full flex flex-col justify-between">
          {splitCategories.map((category) => (
            <div key={category.title} className="h-[48%] w-full">
              <FinancialCategoryCard
                {...category}
                categoryType={category.type}
                onTransactionAdded={refetchData}
                selectedDate={selectedDate}
              >
                {category.items.map((item) => (
                  <FinancialEntryRow
                    key={item.id}
                    id={item.id}
                    label={item.description}
                    amount={item.amount}
                    categoryTitle={category.title}
                    onDelete={handleDeleteTransaction}
                    isDeleting={deletingIds.includes(item.id)}
                  />
                ))}
              </FinancialCategoryCard>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}