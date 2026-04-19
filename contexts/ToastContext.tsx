import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toastMessage: string;
  toastType: ToastType;
  isToastVisible: boolean;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastTimeout, setToastTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
    const newTimeout = setTimeout(() => {
      setIsToastVisible(false);
    }, 3000); // Hide after 3 seconds
    setToastTimeout(newTimeout);
  }, [toastTimeout]);

  const value = { showToast, toastMessage, toastType, isToastVisible };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};