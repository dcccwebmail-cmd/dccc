
import React, { useRef, useEffect, useState } from 'react';

interface SectionWrapperProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  delay?: string;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, className = '', children, delay = '0s' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const style = {
    transitionDelay: isVisible ? delay : '0s',
  };

  return (
    <section 
      id={id} 
      ref={sectionRef} 
      style={style}
      className={`py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden ${className} transition-opacity duration-1000 ${isVisible ? 'opacity-100 animate-fade-in-up' : 'opacity-0'}`}
    >
      {children}
    </section>
  );
};

export default SectionWrapper;