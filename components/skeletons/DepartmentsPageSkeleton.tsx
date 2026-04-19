import React from 'react';
import SectionWrapper from '../SectionWrapper';
import PageHeaderSkeleton from './PageHeaderSkeleton';
import CardSkeleton from './CardSkeleton';

const DepartmentsPageSkeleton: React.FC = () => {
    return (
        <div>
            <PageHeaderSkeleton />
            <SectionWrapper className="!pt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <CardSkeleton key={index} />
                    ))}
                </div>
            </SectionWrapper>
        </div>
    );
};

export default DepartmentsPageSkeleton;
