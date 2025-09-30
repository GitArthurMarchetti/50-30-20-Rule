// app/page.tsx
"use client"; 

import { useState, useEffect } from "react";

import Sidebar from "@/components/local/dashboard/Header/Sidebar";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardHeader from "@/components/local/dashboard/Header/DashboardHeader";
import FinancialCategoryCard from "@/components/local/dashboard/Header/financials/FinancialCategoryCard";
import FinancialEntryRow from "@/components/local/dashboard/Header/financials/FinancialEntryRow";
import { TransactionType } from "./generated/prisma";

interface FinancialCategory {
  title: string;
  type: TransactionType;
  actualPercentage: string;
  maxPercentage: string;
  actualAmount: string;
  maxAmount: string;
  items: { id: number; description: string; amount: number }[];
}

interface DashboardData {
  income: FinancialCategory;
  needs: FinancialCategory;
  wants: FinancialCategory;
  reserves: FinancialCategory;
  investments: FinancialCategory;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Falha ao buscar os dados do dashboard.');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <p>Carregando seu dashboard...</p>; // Você pode colocar um spinner bonito aqui
  }

  if (error) {
    return <p>Erro: {error}</p>;
  }
  
  if (!data) {
    return <p>Nenhum dado encontrado.</p>
  }

  const mainCategories = [data.income, data.needs, data.wants];
  const splitCategories = [data.reserves, data.investments];

  return (
    <DashboardLayout sidebar={<Sidebar />}>
      <DashboardHeader />
      <section className="h-8/9 w-full mt-auto flex flex-row justify-evenly gap-4">
        {mainCategories.map((category) => (
          <div key={category.title} className="w-1/5 h-full">
            <FinancialCategoryCard
              title={category.title}
              categoryType={category.type}
              maxPercentage={category.maxPercentage}
              actualPercentage={category.actualPercentage}
              actualAmount={category.actualAmount}
              maxAmount={category.maxAmount}
            >
              {category.items.map((item) => (
                <FinancialEntryRow key={item.id} label={item.description} amount={item.amount} categoryTitle={category.title} />
              ))}
            </FinancialCategoryCard>
          </div>
        ))}
        <div className="w-1/5 h-full flex flex-col justify-between">
          {splitCategories.map((category) => (
            <div key={category.title} className="h-[48%] w-full">
              <FinancialCategoryCard
                title={category.title}
                categoryType={category.type}
                maxPercentage={category.maxPercentage}
                actualPercentage={category.actualPercentage}
                actualAmount={category.actualAmount}
                maxAmount={category.maxAmount}
              >
                {category.items.map((item) => (
                  <FinancialEntryRow key={item.id} label={item.description} amount={item.amount} categoryTitle={category.title} />
                ))}
              </FinancialCategoryCard>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}