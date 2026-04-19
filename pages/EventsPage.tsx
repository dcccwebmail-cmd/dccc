import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Event } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import EventCard from '../components/EventCard';
import EventsPageSkeleton from '../components/skeletons/EventsPageSkeleton';
import PageTitle from '../components/PageTitle';

const EventsPage: React.FC = () => {
  const { data, loading } = useData();

  const [upcomingEvents, pastEvents] = useMemo(() => {
    if (!data?.events) return [[], []];
    
    const sortedEvents = [...data.events].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    
    const upcoming = sortedEvents.filter(e => e.status === 'upcoming').reverse();
    const past = sortedEvents.filter(e => e.status === 'past');
    
    return [upcoming, past];
  }, [data]);

  if (loading) {
    return <EventsPageSkeleton />;
  }

  return (
    <div className="pt-28">
      <PageTitle title="Club Events | Dhaka College Cultural Club" />
      <SectionWrapper>
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary">Club Events</h1>
            <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">Explore our portfolio of vibrant events that bring our community together.</p>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

      </SectionWrapper>
    </div>
  );
};

export default EventsPage;