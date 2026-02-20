"use client";

import * as React from "react";
import { X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ id, title, description, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  // Animate in on mount
  React.useEffect(() => {
    // Small delay to trigger animation
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timeout);
  }, []);

  // Auto-dismiss after duration
  React.useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 500); // Wait for animation to complete (matches duration-500)
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, isVisible]);

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden transaction-background rounded-md border border-green-500/30 shadow-xl backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-20 opacity-0 scale-95"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5 text-income" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            {description && (
              <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</div>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(), 500);
            }}
            className="ml-2 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-60 hover:opacity-100 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-6 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-3 px-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
