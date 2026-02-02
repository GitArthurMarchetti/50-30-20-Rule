"use client";

// ============================================================================
// IMPORTS
// ============================================================================
// External
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

// Internal - Context & Services
import { DashboardProvider, useDashboard } from "./context/DashboardContex";
import { categoryService } from "./lib/client/category-service";

// Internal - Components
import DashboardLayout from "./layout/DashboardLayout";
import FinancialCategoryCard from "./components/local/dashboard/Header/financials/FinancialCategoryCard";
import FinancialEntryRow from "./components/local/dashboard/Header/financials/FinancialEntryRow";
import MonthSelector from "./components/local/dashboard/Header/MonthSelector";

// ============================================================================
// LAZY LOADED COMPONENTS (Code Splitting)
// ============================================================================
const Sidebar = dynamic(
  () => import("./components/local/dashboard/Header/Sidebar"),
  {
    loading: () => (
      <div className="flex flex-col h-full">
        <div className="animate-pulse bg-gray-700 h-20 w-full" />
      </div>
    ),
  }
);

const DashboardHeader = dynamic(
  () => import("./components/local/dashboard/Header/DashboardHeader")
);

const DashboardSkeleton = dynamic(
  () => import("./components/local/dashboard/Header/DashboardSkeleton")
);

const FinancialStatementSkeleton = dynamic(
  () =>
    import(
      "./components/local/dashboard/Header/financials/FinancialStatementSkeleton"
    )
);

// ============================================================================
// COMPONENT
// ============================================================================
function DashboardContent() {
  // --------------------------------------------------------------------------
  // State & Context
  // --------------------------------------------------------------------------
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
    handleDeleteTransaction,
  } = useDashboard();

  const [categoryMap, setCategoryMap] = useState<Map<number, string>>(
    new Map()
  );
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  const fetchCategories = useCallback(async () => {
    setIsCategoryLoading(true);
    try {
      const categories = await categoryService.getAll();
      const newMap = new Map<number, string>(
        categories.map((cat) => [cat.id, cat.name])
      );
      setCategoryMap(newMap);
    } catch {
      // WHY: Silently handle category fetch failures - component can function without category names
      // Category IDs are still valid even if names can't be loaded
    } finally {
      setIsCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --------------------------------------------------------------------------
  // Memoized Values (Must be before early returns)
  // --------------------------------------------------------------------------
  const mainCategories = useMemo(() => {
    if (!data?.cards) return [];
    const { income, needs, wants } = data.cards;
    return [income, needs, wants];
  }, [data?.cards]);

  const splitCategories = useMemo(() => {
    if (!data?.cards) return [];
    const { reserves, investments } = data.cards;
    return [reserves, investments];
  }, [data?.cards]);

  const handleRefetch = useCallback(() => {
    refetchData();
  }, [refetchData]);

  // --------------------------------------------------------------------------
  // Early Returns
  // --------------------------------------------------------------------------
  if ((isLoading && !data) || isCategoryLoading) {
    return (
      <DashboardLayout
        sidebar={
          <div className="flex flex-col h-full">
            <MonthSelector
              selectedDate={selectedDate}
              onMonthChange={() => {}}
              onYearChange={() => {}}
            />
            <FinancialStatementSkeleton />
          </div>
        }
      >
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!data) {
    return null;
  }

  if (error) {
    return (
      <p className="text-red-500 text-center mt-10">Erro: {error}</p>
    );
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

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
        {/* Main Categories */}
        {mainCategories.map((category) => (
          <div key={category.title} className="w-1/5 h-full">
            <FinancialCategoryCard
              {...category}
              categoryType={category.type}
              onTransactionAdded={handleRefetch}
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

        {/* Split Categories (Reserves & Investments) */}
        <div className="w-1/5 h-full flex flex-col justify-between">
          {splitCategories.map((category) => (
            <div key={category.title} className="h-[48%] w-full">
              <FinancialCategoryCard
                {...category}
                categoryType={category.type}
                onTransactionAdded={handleRefetch}
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

// ============================================================================
// EXPORT
// ============================================================================
export default function Home() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}