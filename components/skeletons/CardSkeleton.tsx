import React from 'react';

const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg bg-card-bg backdrop-blur-md border border-border-color">
      <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
      <div className="p-5">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse mb-2"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse mb-3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse mb-1"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
      </div>
    </div>
  );
};

export default CardSkeleton;
