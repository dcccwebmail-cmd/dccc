import React from 'react';

const EventDetailPageSkeleton: React.FC = () => {
  return (
    <div>
      <div className="relative w-full h-[50vh] min-h-[400px] bg-slate-200 dark:bg-slate-700 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-8 md:p-12">
            <div className="max-w-7xl mx-auto w-full">
                <div className="h-6 w-1/4 bg-slate-300 dark:bg-slate-600 rounded mb-4"></div>
                <div className="h-14 w-3/4 bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto py-12 px-4 animate-pulse">
        <div className="h-8 w-2/3 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
        <div className="space-y-3">
            <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-5 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="mt-12 h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    </div>
  );
};

export default EventDetailPageSkeleton;
