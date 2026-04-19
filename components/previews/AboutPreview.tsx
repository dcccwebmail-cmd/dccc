import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import SectionWrapper from '../SectionWrapper';

const ImpactNumber: React.FC<{ value: number, label: string, suffix?: string }> = ({ value, label, suffix }) => (
    <div className="text-center">
        <p className="text-4xl md:text-5xl font-extrabold text-accent">
            {value}{suffix}
        </p>
        <p className="text-sm md:text-base text-text-secondary uppercase tracking-wider mt-1">{label}</p>
    </div>
);

const AboutPreview: React.FC = () => {
    const { data } = useData();
    const aboutData = data?.about;

    if (!aboutData) return null;

    return (
        <SectionWrapper id="about">
            <div className="relative isolate">
                {/* Decorative background blur */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-accent to-dccc-red opacity-20 dark:opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4">
                            {aboutData.preview_title}
                        </h2>
                        <p className="text-2xl font-semibold text-accent mb-6">{aboutData.vision_tagline}</p>
                        <p className="text-text-secondary mb-8 text-lg">
                            {aboutData.about_short}
                        </p>
                        <div className="grid grid-cols-3 gap-y-10 gap-x-4 mb-10">
                            <ImpactNumber value={aboutData.founded_year} label="Founded" />
                            <ImpactNumber value={aboutData.prizes_won} label="Prizes Won" suffix="+" />
                            <ImpactNumber value={aboutData.total_departments} label="Departments" />
                        </div>
                        <Link to="/about" title="Learn more about DCCC" className="inline-block bg-accent text-accent-text font-semibold py-3 px-8 rounded-full hover:bg-accent-hover transition-transform transform hover:scale-105 duration-300 animate-pulse-accent">
                            Discover Our Full Story
                        </Link>
                    </div>
                    <div>
                        <img
                            src={aboutData.preview_image_url}
                            alt="Dhaka College Cultural Club members gathered for a photo"
                            className="rounded-lg shadow-xl w-full h-auto object-cover aspect-[4/3]"
                        />
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};

export default AboutPreview;