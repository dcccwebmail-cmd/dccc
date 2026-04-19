import React from 'react';
import SectionWrapper from '../SectionWrapper';
import PageHeaderSkeleton from './PageHeaderSkeleton';

const ZigZagSkeleton: React.FC<{ reversed?: boolean }> = ({ reversed }) => (
    <div className="grid md:grid-cols-2 gap-12 items-center mb-20 animate-pulse">
      <div className={`order-2 ${reversed ? 'md:order-1' : 'md:order-2'} space-y-4`}>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className={`order-1 ${reversed ? 'md:order-2' : 'md:order-1'}`}>
        <div className="rounded-lg bg-slate-200 dark:bg-slate-700 w-full aspect-[4/3]"></div>
      </div>
    </div>
);

const AboutPageSkeleton: React.FC = () => {
  return (
    <div>
      <PageHeaderSkeleton />
      <SectionWrapper className="!pt-20">
        <ZigZagSkeleton />
        <ZigZagSkeleton reversed />
        <ZigZagSkeleton />
      </SectionWrapper>
    </div>
  );
};

export default AboutPageSkeleton;
