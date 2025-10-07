"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DashboardData } from '../types/dashboardTypes';


interface DashboardContextType {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  selectedDate: Date;
  includeResult: boolean;
  deletingIds: number[];
  handleMonthChange: (monthIndex: number) => void;
  handleToggleResult: () => void;
  refetchData: () => Promise<void>;
  handleDeleteTransaction: (id: number) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {

    const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [includeResult, setIncludeResult] = useState(true);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const fetchData = useCallback(async (date: Date, resultIncluded: boolean) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    try {
      setError(null);
      const response = await fetch(`/api/dashboard?year=${year}&month=${month}&includeResult=${resultIncluded}`);
      if (!response.ok) throw new Error('Falha ao buscar os dados.');
      const resultData = await response.json();
      setData(resultData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData(selectedDate, includeResult).finally(() => {
      setIsLoading(false);
    });
  }, [selectedDate, includeResult, fetchData]);

  const handleMonthChange = (monthIndex: number) => {
    setSelectedDate(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setDate(1);
      newDate.setMonth(monthIndex);
      return newDate;
    });
  };
  
  const handleToggleResult = () => {
    setIncludeResult(prevState => !prevState);
  };

  const refetchData = async () => {
    await fetchData(selectedDate, includeResult);
  };

  const handleDeleteTransaction = async (id: number) => {
    setDeletingIds(prev => [...prev, id]);
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao apagar no servidor.');
      await refetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao apagar.');
    } finally {
      setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
    }
  };

  const value = {
    data,
    isLoading,
    error,
    selectedDate,
    includeResult,
    deletingIds,
    handleMonthChange,
    handleToggleResult,
    refetchData,
    handleDeleteTransaction,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard deve ser usado dentro de um DashboardProvider');
  }
  return context;
};