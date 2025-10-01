"use client";

import { useState, useEffect, useCallback } from "react";

// Verifique se estes caminhos de importação estão corretos para a sua estrutura
import Sidebar from "@/components/local/dashboard/Header/Sidebar";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardHeader from "@/components/local/dashboard/Header/DashboardHeader";
import FinancialCategoryCard from "@/components/local/dashboard/Header/financials/FinancialCategoryCard";
import FinancialEntryRow from "@/components/local/dashboard/Header/financials/FinancialEntryRow";
import { TransactionType } from "./generated/prisma";

interface TransactionItem {
  id: number;
  description: string;
  amount: number;
}

interface FinancialCategory {
  title: string;
  type: TransactionType;
  actualPercentage: string;
  maxPercentage: string;
  actualAmount: string;
  maxAmount: string;
  items: TransactionItem[];
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
  // Estado para controlar quais transações estão no processo de serem apagadas
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Falha ao buscar os dados.');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    }
    initialLoad();
  }, [fetchData]);

  const handleTransactionAdded = async () => {
    await fetchData();
  };

  const handleDeleteTransaction = async (id: number) => {
    // Adiciona o ID à lista de deleção para ativar o efeito visual
    setDeletingIds(prev => [...prev, id]);

    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Falha ao apagar no servidor.');
      }
      // Após o sucesso, busca os dados atualizados, o que removerá a linha permanentemente
      await fetchData();
    } catch (err) {
      setError('Não foi possível apagar a transação. Tente novamente.');
    } finally {
      // Remove o ID da lista de deleção após a conclusão
      setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
    }
  };

  if (isLoading) return <p className="text-white text-center mt-10">Carregando...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">Erro: {error}</p>;
  if (!data) return <p className="text-gray-400 text-center mt-10">Nenhum dado encontrado.</p>;

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
              onTransactionAdded={handleTransactionAdded}
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
                title={category.title}
                categoryType={category.type}
                maxPercentage={category.maxPercentage}
                actualPercentage={category.actualPercentage}
                actualAmount={category.actualAmount}
                maxAmount={category.maxAmount}
                onTransactionAdded={handleTransactionAdded}
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

