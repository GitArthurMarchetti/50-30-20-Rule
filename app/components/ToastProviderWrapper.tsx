"use client";

import { ToastProvider } from "../context/ToastContext";

export function ToastProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
