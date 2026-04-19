import React from 'react';
import SectionWrapper from '../SectionWrapper';
import PageHeaderSkeleton from './PageHeaderSkeleton';
import CardSkeleton from './CardSkeleton';

const EventsPageSkeleton: React.FC = () => {
    return (
        <div className="pt-28">
            <SectionWrapper>
                <div className="text-center mb-12 animate-pulse">
                    <div className="h-12 w-1/2 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="h-6 w-3/4 mx-auto bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="mb-16">
                    <div className="h-8 w-1/3 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-8 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <CardSkeleton key={index} />
                        ))}
                    </div>
                </div>
                <div>
                    <div className="h-8 w-1/3 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-8 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                         {Array.from({ length: 3 }).map((_, index) => (
                            <CardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </SectionWrapper>
        </div>
    );
};

export default EventsPageSkeleton;
