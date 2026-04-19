import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Executive } from '../../types';
import SectionWrapper from '../SectionWrapper';
import PanelMemberCard from '../PanelMemberCard';

const PanelsPreview: React.FC = () => {
  const { data } = useData();
  const [leaders, setLeaders] = useState<Executive[]>([]);

  useEffect(() => {
    if (data?.executives && data.executives.length > 0) {
      const leaderOrder = ["President", "Vice President", "General Secretary"];
      
      const allExecutives = data.executives;
      let currentYear: number;
      
      const yearsWithPresident = allExecutives
        .filter(e => e.position === 'President')
        .map(e => e.year);
        
      if (yearsWithPresident.length > 0) {
        currentYear = Math.max(...yearsWithPresident);
      } else {
        currentYear = Math.max(...allExecutives.map(e => e.year));
      }
      
      const presentLeaders = allExecutives
        .filter(e => leaderOrder.includes(e.position) && e.year === currentYear)
        .sort((a, b) => leaderOrder.indexOf(a.position) - leaderOrder.indexOf(b.position));
        
      setLeaders(presentLeaders);
    }
  }, [data]);

  return (
    <SectionWrapper id="panels" delay="300ms">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary">Meet Our Leaders</h2>
        <p className="text-lg text-text-secondary mt-2 max-w-2xl mx-auto">The dedicated students steering the club towards success.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
        {leaders.map(leader => (
           <div key={leader.id} className="w-full sm:max-w-sm mx-auto">
             <PanelMemberCard member={leader} />
           </div>
        ))}
      </div>

      <div className="text-center mt-16">
        <Link to="/panels" className="inline-block bg-accent text-accent-text font-semibold py-3 px-8 rounded-full hover:bg-accent-hover transition-transform transform hover:scale-105 duration-300">
          View All Panels
        </Link>
      </div>
    </SectionWrapper>
  );
};

export default PanelsPreview;