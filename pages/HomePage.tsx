import React from 'react';
import Hero from '../components/previews/Hero';
import AboutPreview from '../components/previews/AboutPreview';
import UpcomingEventCountdown from '../components/previews/UpcomingEventCountdown';
import PanelsPreview from '../components/previews/PanelsPreview';
import { useData } from '../contexts/DataContext';
import HomePageSkeleton from '../components/skeletons/HomePageSkeleton';
import PageTitle from '../components/PageTitle';

const HomePage: React.FC = () => {
  const { loading } = useData();

  if (loading) {
    return <HomePageSkeleton />;
  }
  
  return (
    <div>
      <PageTitle title="Dhaka College Cultural Club - DCCC" />
      <Hero />
      <AboutPreview />
      <UpcomingEventCountdown />
      <PanelsPreview />
    </div>
  );
};

export default HomePage;