"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastContainer, ToastProps } from "@/components/ui/toast";

interface ToastContextType {
  showToast: (title: string, description?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback(
    (title: string, description?: string, duration?: number) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastProps = {
        id,
        title,
        description,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
