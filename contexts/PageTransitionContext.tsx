import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface PageTransitionContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const PageTransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const value = useMemo(() => ({ isLoading, setIsLoading }), [isLoading]);

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
    </PageTransitionContext.Provider>
  );
};

export const usePageTransition = (): PageTransitionContextType => {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
};
