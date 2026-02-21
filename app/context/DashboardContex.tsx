"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
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
  handleYearChange: (year: number) => void;
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

  // OPTIMIZATION: Memoize fetchData to avoid unnecessary recreation
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
        : 'An error occurred.';
      setError(message);
    }
  }, []); // Empty dependencies - function doesn't depend on external state

  useEffect(() => {
    // If data already exists, it's a refresh (shows skeleton)
    // If no data, it's initial loading (shows general loading)
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

  // OPTIMIZATION: Memoize handlers to avoid recreation
  const handleMonthChange = useCallback((monthIndex: number) => {
    setSelectedDate(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setDate(1);
      newDate.setMonth(monthIndex);
      return newDate;
    });
  }, []);

  const handleYearChange = useCallback((year: number) => {
    setSelectedDate(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setFullYear(year);
      return newDate;
    });
  }, []);

  const handleToggleResult = useCallback(() => {
    setIncludeResult(prevState => !prevState);
  }, []);

  const refetchData = useCallback(async () => {
    await fetchData(selectedDate, includeResult);
  }, [selectedDate, includeResult, fetchData]);

  const handleDeleteTransaction = useCallback(async (id: number) => {
    setDeletingIds(prev => [...prev, id]);
    try {
      await transactionService.deleteTransaction(id);
      await fetchData(selectedDate, includeResult);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'An error occurred while deleting.';
      setError(message);
    } finally {
      setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
    }
  }, [selectedDate, includeResult, fetchData]);

  const setUpdatingTransaction = useCallback((id: number, isUpdating: boolean) => {
    setUpdatingIds(prev => {
      if (isUpdating) {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter(updatingId => updatingId !== id);
      }
    });
  }, []);

  // OPTIMIZATION: Memoize value object to avoid unnecessary recreation
  const value = useMemo(() => ({
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
    handleYearChange,
    handleToggleResult,
    refetchData,
    handleDeleteTransaction,
    setCreatingTransaction,
    setUpdatingTransaction,
  }), [
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
    handleYearChange,
    handleToggleResult,
    refetchData,
    handleDeleteTransaction,
    setUpdatingTransaction,
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

