import React from 'react';
import { useData } from '../contexts/DataContext';
import { AboutSection } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import AboutPageSkeleton from '../components/skeletons/AboutPageSkeleton';
import PageTitle from '../components/PageTitle';

const ZigZagSection: React.FC<{ section: AboutSection; index: number }> = ({ section, index }) => {
  const isReversed = index % 2 !== 0;
  return (
    <div className="grid md:grid-cols-2 gap-12 items-center mb-20 last:mb-0">
      <div className={`order-2 ${isReversed ? 'md:order-1' : 'md:order-2'}`}>
        <h3 className="text-3xl font-bold text-text-primary mb-4">{section.title}</h3>
        <p className="text-text-secondary whitespace-pre-line leading-relaxed">{section.description}</p>
      </div>
      <div className={`order-1 ${isReversed ? 'md:order-2' : 'md:order-1'}`}>
        <img src={section.image_url} alt={section.title} className="rounded-lg shadow-xl w-full h-auto object-cover aspect-[4/3]" />
      </div>
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { data, loading } = useData();
  const aboutData = data?.about;

  if (loading) {
    return <AboutPageSkeleton />;
  }
  
  if (!aboutData) {
      return <div className="text-center p-12 pt-28">About information not found.</div>;
  }

  return (
    <div>
      <PageTitle title="Our Story | Dhaka College Cultural Club" />
      <div className="pt-24">
        <section className="py-16 md:py-20 text-center">
          <div className="max-w-3xl mx-auto px-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight">Our Story</h1>
            <p className="mt-4 text-lg md:text-xl text-accent font-semibold">
              {aboutData.vision_tagline}
            </p>
            <p className="mt-2 text-text-secondary">Founded in {aboutData.founded_year}</p>
          </div>
        </section>
      </div>

      <SectionWrapper className="!pt-20">
        {aboutData.sections.map((section, index) => (
          <ZigZagSection key={index} section={section} index={index} />
        ))}
      </SectionWrapper>
    </div>
  );
};

export default AboutPage;