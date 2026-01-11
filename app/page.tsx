"use client"; 
import { DashboardProvider, useDashboard } from "./context/DashboardContex";
import { useState, useEffect } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import Sidebar from "./components/local/dashboard/Header/Sidebar";
import DashboardHeader from "./components/local/dashboard/Header/DashboardHeader";
import DashboardSkeleton from "./components/local/dashboard/Header/DashboardSkeleton";
import MonthSelector from "./components/local/dashboard/Header/MonthSelector";
import FinancialCategoryCard from "./components/local/dashboard/Header/financials/FinancialCategoryCard";
import FinancialEntryRow from "./components/local/dashboard/Header/financials/FinancialEntryRow";
import FinancialStatementSkeleton from "./components/local/dashboard/Header/financials/FinancialStatementSkeleton";
import { categoryService } from "./lib/client/category-service";

function DashboardContent() {

  const {
    isLoading,
    isRefreshing,
    error,
    data,
    selectedDate,
    deletingIds,
    handleMonthChange,
    handleYearChange,
    refetchData,
    handleDeleteTransaction
  } = useDashboard();


  const [categoryMap, setCategoryMap] = useState<Map<number, string>>(new Map());
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      setIsCategoryLoading(true);
      try {
        const categories = await categoryService.getAll();
        const newMap = new Map<number, string>();
        categories.forEach(cat => {
          newMap.set(cat.id, cat.name);
        });
        setCategoryMap(newMap);
      } catch (e) {
        console.error("Falha ao buscar categorias", e);
      } finally {
        setIsCategoryLoading(false);
      }
    }
    
    fetchCategories();
  }, []);


  // Se não tem dados ainda, mostra skeleton sutil
  if ((isLoading && !data) || isCategoryLoading) {
    return (
      <DashboardLayout
        sidebar={
          <div className="flex flex-col h-full">
            <MonthSelector
              selectedDate={selectedDate}
              onMonthChange={() => {}} // No-op during loading
              onYearChange={() => {}} // No-op during loading
            />
            <FinancialStatementSkeleton />
          </div>
        }
      >
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Se não tem dados ainda, não renderiza (ainda está carregando)
  if (!data) {
    return null;
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
          onYearChange={handleYearChange}
          financialStatement={data.financialStatement}
          isRefreshing={isRefreshing}
        />
      }
    >
      <DashboardHeader
        lastMonthsResult={data.lastMonthsResult}
        selectedDate={selectedDate}
      />
      <section className="h-8/9 w-full mt-auto flex flex-row justify-evenly gap-4">
        {mainCategories.map((category) => (
          <div key={category.title} className="w-1/5 h-full">
            <FinancialCategoryCard
              {...category}
              categoryType={category.type}
              onTransactionAdded={refetchData}
              selectedDate={selectedDate}
              isRefreshing={isRefreshing}
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

                  date={item.date}
                  type={item.type}
                  categoryId={item.categoryId}
                  
                  categoryMap={categoryMap}
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
                isRefreshing={isRefreshing}
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

                    date={item.date}
                    type={item.type}
                    categoryId={item.categoryId}

                    categoryMap={categoryMap}
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