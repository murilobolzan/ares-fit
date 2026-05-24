import { useState, useCallback, useEffect } from 'react';
import { Toast, ToastProps } from '@/components/ui/Toast';

export function useToast() {
  const [toastContent, setToastContent] = useState<ToastProps | null>(null);

  const showToast = useCallback((message: string, type: ToastProps['type']) => {
    setToastContent({ message, type });
  }, []);

  useEffect(() => {
    if (toastContent) {
      const timer = setTimeout(() => {
        setToastContent(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastContent]);

  const ToastComponent = useCallback(() => {
    if (!toastContent) return null;
    return Toast({ message: toastContent.message, type: toastContent.type });
  }, [toastContent]);

  return {
    showToast,
    ToastComponent,
  };
}