import React from 'react';
import SectionWrapper from '../SectionWrapper';

const DepartmentDetailPageSkeleton: React.FC = () => {
    return (
        <div className="pt-28">
            <SectionWrapper>
                <div className="animate-pulse">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div className="h-10 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 bg-slate-200 dark:bg-slate-700 p-8 rounded-lg h-64"></div>
                        <div className="md:col-span-1 bg-slate-200 dark:bg-slate-700 p-8 rounded-lg h-64"></div>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    );
};

export default DepartmentDetailPageSkeleton;
