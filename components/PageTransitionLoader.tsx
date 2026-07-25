import React, { useState } from 'react';
import { usePageTransition } from '../contexts/PageTransitionContext';

const PageTransitionLoader: React.FC = () => {
  const { isLoading } = usePageTransition();
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {!imageError ? (
        <img
          src="https://ik.imagekit.io/dccc/dccc-logo.png"
          alt="DCCC Loading..."
          onError={() => setImageError(true)}
          className={`h-24 w-24 object-contain transition-all duration-300 ${isLoading ? 'animate-logo-pulse' : ''}`}
        />
      ) : (
        <div className={`relative flex items-center justify-center h-24 w-24 ${isLoading ? 'animate-logo-pulse' : ''}`}>
          {/* Inner Circle Spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin" style={{ animationDuration: '3s' }}></div>
          {/* Decorative Outer Dashed Ring */}
          <div className="absolute inset-2 rounded-full border border-dashed border-accent/40 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
          {/* Center Brand Typography */}
          <div className="z-10 flex flex-col items-center justify-center">
            <span className="text-xl font-black tracking-wider text-accent font-poppins">DCCC</span>
            <span className="text-[8px] font-bold tracking-widest text-text-secondary uppercase">Dhaka College</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageTransitionLoader;
