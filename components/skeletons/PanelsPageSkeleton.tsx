import React from 'react';
import SectionWrapper from '../SectionWrapper';
import PageHeaderSkeleton from './PageHeaderSkeleton';

const PanelMemberSkeleton: React.FC = () => (
    <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 w-full max-w-[230px] mx-auto aspect-[3/4] animate-pulse"></div>
);

const PanelsPageSkeleton: React.FC = () => {
  return (
    <div className="pt-28">
      <section className="text-center pb-16 px-4 animate-pulse">
        <div className="h-12 w-1/2 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="h-6 w-3/4 mx-auto bg-slate-200 dark:bg-slate-700 rounded"></div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-9 w-1/3 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-12 animate-pulse"></div>
          <div className="flex flex-col items-center gap-10">
              <PanelMemberSkeleton />
              <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl">
                {Array.from({ length: 4 }).map((_, i) => <PanelMemberSkeleton key={i} />)}
              </div>
          </div>
        </div>
      </section>

       <section className="py-16 px-4">
          <div className="h-9 w-1/3 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-12 animate-pulse"></div>
          <div className="max-w-5xl mx-auto">
            <div className="h-14 w-full bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse"></div>
            <div className="h-14 w-full bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse"></div>
          </div>
        </section>
    </div>
  );
};

export default PanelsPageSkeleton;
