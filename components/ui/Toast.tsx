'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ToastContext, ToastType } from '@/lib/hooks/useToast';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { haptics } from '@/lib/haptics';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Dispara haptic feedback dependendo do tipo
    if (type === 'success') haptics.success();
    else if (type === 'error') haptics.error();
    else if (type === 'warning') haptics.medium();
    else haptics.light();

    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type }];
      if (newToasts.length > 3) return newToasts.slice(newToasts.length - 3);
      return newToasts;
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return { border: 'border-l-[#22C55E]', icon: <CheckCircle2 className="text-[#22C55E]" size={20} /> };
      case 'error': return { border: 'border-l-[#FF3B30]', icon: <XCircle className="text-[#FF3B30]" size={20} /> };
      case 'warning': return { border: 'border-l-[#FF9F0A]', icon: <AlertTriangle className="text-[#FF9F0A]" size={20} /> };
      case 'info': return { border: 'border-l-[#FFE600]', icon: <Info className="text-[#FFE600]" size={20} /> };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 p-4 pt-safe pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div 
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between w-full max-w-sm bg-[#0F0F0F] border border-[#222225] border-l-4 ${styles.border} p-4 rounded-2xl shadow-xl animate-slide-down touch-manipulation`}
              onClick={() => removeToast(toast.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                {styles.icon}
                <p className="text-white text-sm font-medium leading-tight">{toast.message}</p>
              </div>
              <button className="text-[#555558] hover:text-[#A1A1AA] transition-colors p-1">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}