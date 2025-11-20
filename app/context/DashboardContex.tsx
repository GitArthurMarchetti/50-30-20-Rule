"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { DashboardData } from '../types/dashboardTypes';
import { dashboardService } from '../lib/client/dashboard-service';
import { transactionService } from '../lib/client/transaction-service';
import { formatDateForAPI } from '../lib/client/utils';
import { ApiError } from '../lib/client/api-client';

interface DashboardContextType {
  data: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  selectedDate: Date;
  includeResult: boolean;
  deletingIds: number[];
  updatingIds: number[];
  creatingTransaction: boolean;
  handleMonthChange: (monthIndex: number) => void;
  handleToggleResult: () => void;
  refetchData: () => Promise<void>;
  handleDeleteTransaction: (id: number) => Promise<void>;
  setCreatingTransaction: (isCreating: boolean) => void;
  setUpdatingTransaction: (id: number, isUpdating: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [includeResult, setIncludeResult] = useState(true);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  const hasDataRef = useRef(false);

  const fetchData = useCallback(async (date: Date, resultIncluded: boolean) => {
    try {
      setError(null);
      const monthParam = formatDateForAPI(date);
      const resultData = await dashboardService.getDashboard({
        month: monthParam,
        includeResult: resultIncluded,
      });
      setData(resultData);
      hasDataRef.current = true;
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
    // Se já tem dados, é um refresh (mostra skeleton)
    // Se não tem dados, é loading inicial (mostra loading geral)
    if (hasDataRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    fetchData(selectedDate, includeResult).finally(() => {
      setIsLoading(false);
      setIsRefreshing(false);
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

  const setUpdatingTransaction = (id: number, isUpdating: boolean) => {
    setUpdatingIds(prev => {
      if (isUpdating) {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter(updatingId => updatingId !== id);
      }
    });
  };

  const value = {
    data,
    isLoading,
    isRefreshing,
    error,
    selectedDate,
    includeResult,
    deletingIds,
    updatingIds,
    creatingTransaction,
    handleMonthChange,
    handleToggleResult,
    refetchData,
    handleDeleteTransaction,
    setCreatingTransaction,
    setUpdatingTransaction,
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

