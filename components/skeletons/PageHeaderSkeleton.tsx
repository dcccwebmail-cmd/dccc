import React from 'react';

const PageHeaderSkeleton: React.FC = () => {
  return (
    <div className="pt-28">
      <section className="py-16 md:py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 animate-pulse">
          <div className="h-10 md:h-14 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-5 md:h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto"></div>
        </div>
      </section>
    </div>
  );
};

export default PageHeaderSkeleton;
