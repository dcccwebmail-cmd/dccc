import React from 'react';
import SectionWrapper from '../SectionWrapper';
import CardSkeleton from './CardSkeleton';

const HomePageSkeleton: React.FC = () => {
  return (
    <div>
      {/* Hero Skeleton */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center animate-pulse">
            <div className="h-10 md:h-12 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto mb-4"></div>
            <div className="h-14 md:h-20 bg-slate-200 dark:bg-slate-700 rounded w-full mx-auto mb-6"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mx-auto mb-8"></div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview Skeleton */}
      <SectionWrapper>
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center animate-pulse">
          <div className="lg:order-2">
            <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 w-full aspect-[4/3]"></div>
          </div>
          <div className="lg:order-1 space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
            </div>
            <div className="h-12 w-56 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </SectionWrapper>

      {/* Countdown Skeleton */}
      <SectionWrapper>
        <div className="bg-card-bg backdrop-blur-md rounded-3xl max-w-4xl mx-auto p-8 md:p-12 text-center animate-pulse">
          <div className="h-6 w-1/3 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="h-10 w-2/3 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-8"></div>
          <div className="flex justify-center items-center space-x-2 md:space-x-4 mb-10">
            <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="h-12 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
      </SectionWrapper>
      
       {/* Panels Preview Skeleton */}
      <SectionWrapper>
        <div className="text-center mb-16 animate-pulse">
            <div className="h-10 w-1/2 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-6 w-3/4 mx-auto bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 aspect-[3/4] animate-pulse"></div>
            <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 aspect-[3/4] animate-pulse"></div>
            <div className="rounded-2xl bg-slate-200 dark:bg-slate-700 aspect-[3/4] animate-pulse"></div>
        </div>
      </SectionWrapper>
    </div>
  );
};

export default HomePageSkeleton;
