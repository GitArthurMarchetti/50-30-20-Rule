"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DashboardData } from '../types/dashboardTypes';
import { dashboardService } from '../lib/client/dashboard-service';
import { transactionService } from '../lib/client/transaction-service';
import { formatDateForAPI } from '../lib/client/utils';
import { ApiError } from '../lib/client/api-client';

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
    try {
      setError(null);
      const monthParam = formatDateForAPI(date);
      const resultData = await dashboardService.getDashboard({
        month: monthParam,
        includeResult: resultIncluded,
      });
      setData(resultData);
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Ocorreu um erro.';
      setError(message);
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
      await transactionService.deleteTransaction(id);
      await refetchData();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'Ocorreu um erro ao apagar.';
      setError(message);
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

