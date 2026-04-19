import React from 'react';
import { useData } from '../../contexts/DataContext';
import ParticleNetwork from './ParticleNetwork';

const Hero: React.FC = () => {
  const { data, loading } = useData();
  const heroData = data?.hero;

  const getAnimStyle = (delay: number) => ({
    animationDelay: `${delay}ms`,
    animationFillMode: 'backwards' as 'backwards',
  });
  
  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <ParticleNetwork />
      </div>
      
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && <div className="text-text-primary text-2xl text-center">Loading...</div>}
        {heroData && !loading && (
          <div className="max-w-3xl mx-auto text-center">
            <h1 
              className="text-text-primary drop-shadow-lg animate-fade-in-up"
              style={getAnimStyle(200)}
            >
              <span className="block text-3xl md:text-4xl lg:text-5xl font-bold tracking-normal">Dhaka College</span>
              <span className="block text-4xl md:text-6xl lg:text-7xl font-black">Cultural Club</span>
            </h1>
            <p 
              className="mt-4 text-lg md:text-xl text-text-secondary font-medium animate-fade-in-up"
              style={getAnimStyle(400)}
            >
              {heroData.hero_subtitle}
            </p>
            <div 
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
              style={getAnimStyle(600)}
            >
              <a href={heroData.cta_primary_link} className="w-full sm:w-auto inline-block bg-accent text-accent-text font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-accent-hover transition-transform transform hover:scale-105 duration-300 animate-pulse-accent">
                {heroData.cta_primary_text}
              </a>
              <a href={heroData.cta_secondary_link} className="w-full sm:w-auto inline-block bg-card-bg backdrop-blur-sm border border-border-color text-text-primary font-semibold py-3 px-8 rounded-full hover:bg-white/80 dark:hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                {heroData.cta_secondary_text}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;