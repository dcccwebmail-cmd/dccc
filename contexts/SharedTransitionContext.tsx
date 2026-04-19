import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SharedTransitionState {
  sourceRect: Rect | null;
  imageUrl: string | null;
  isTransitioning: boolean;
  targetPath: string | null;
}

interface SharedTransitionContextType {
  transitionState: SharedTransitionState;
  startTransition: (sourceElement: HTMLElement, imageUrl: string, targetPath: string) => void;
  endTransition: () => void;
}

const SharedTransitionContext = createContext<SharedTransitionContextType | undefined>(undefined);

export const SharedTransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transitionState, setTransitionState] = useState<SharedTransitionState>({
    sourceRect: null,
    imageUrl: null,
    isTransitioning: false,
    targetPath: null,
  });
  const navigate = useNavigate();

  const startTransition = (sourceElement: HTMLElement, imageUrl: string, targetPath: string) => {
    const sourceRect = sourceElement.getBoundingClientRect();
    setTransitionState({
      sourceRect: {
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
      },
      imageUrl,
      isTransitioning: true,
      targetPath,
    });
    
    // Allow state to update before navigating
    setTimeout(() => {
        navigate(targetPath);
    }, 0);
  };

  const endTransition = () => {
    setTransitionState({
      sourceRect: null,
      imageUrl: null,
      isTransitioning: false,
      targetPath: null,
    });
  };

  const value = { transitionState, startTransition, endTransition };

  return (
    <SharedTransitionContext.Provider value={value}>
      {children}
    </SharedTransitionContext.Provider>
  );
};

export const useSharedTransition = (): SharedTransitionContextType => {
  const context = useContext(SharedTransitionContext);
  if (!context) {
    throw new Error('useSharedTransition must be used within a SharedTransitionProvider');
  }
  return context;
};
