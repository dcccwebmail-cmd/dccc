import React from 'react';
import { usePageTransition } from '../contexts/PageTransitionContext';

const PageTransitionLoader: React.FC = () => {
  const { isLoading } = usePageTransition();

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <img
        src="https://dhakacollegeculturalclub.com/logo.png"
        alt="DCCC Loading..."
        className={`h-20 w-20 transition-opacity duration-300 ${isLoading ? 'animate-logo-pulse' : ''}`}
      />
    </div>
  );
};

export default PageTransitionLoader;
