import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastProps {
  message: string;
  type: ToastType;
}

export function Toast({ message, type }: ToastProps) {
  const styles = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-white',
  };

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
  }[type];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-[slide-down_0.3s_ease-out]">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-[16px] shadow-lg ${styles[type]}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}