import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Event } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import Accordion from '../components/ui/Accordion'; 
import { CalendarIcon, TrophyIcon, UsersIcon, SparklesIcon, ClockIcon, LocationMarkerIcon, UserCircleIcon } from '../components/icons/MiscIcons';
import EventDetailPageSkeleton from '../components/skeletons/EventDetailPageSkeleton';
import { useSharedTransition } from '../contexts/SharedTransitionContext';
import PageTitle from '../components/PageTitle';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useData();
  const [event, setEvent] = useState<Event | null>(null);
  const { transitionState } = useSharedTransition();
  const { isTransitioning, imageUrl: transitioningImageUrl } = transitionState;

  useEffect(() => {
    if (data?.events && id) {
      const foundEvent = data.events.find(e => e.id === id);
      setEvent(foundEvent || null);
    }
  }, [id, data]);

  const generateGoogleCalendarLink = (event: Event) => {
    const formatIso = (date: string) => date.replace(/-|:|\.\d+/g, '');
    const startTime = formatIso(event.start_date);
    const endTime = formatIso(event.end_date);
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('dates', `${startTime}/${endTime}`);
    url.searchParams.append('details', event.description);
    return url.toString();
  };

  const getTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Dhaka'
    });
  }

  if (loading) {
    return <EventDetailPageSkeleton />;
  }

  if (!event) {
    return <div className="text-center p-12 pt-28">Event not found.</div>;
  }

  // Hide the page's own banner if the transition is happening for this specific event.
  const isThisEventTransitioning = isTransitioning && transitioningImageUrl === event.banner_url;

  const Banner = () => (
    <div className="relative w-full h-[50vh] min-h-[400px]">
      <img
        src={event.banner_url}
        alt={event.title}
        className="w-full h-full object-cover"
        style={{ visibility: isThisEventTransitioning ? 'hidden' : 'visible' }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-8 md:p-12 transition-opacity duration-300"
        style={{ opacity: isThisEventTransitioning ? 0 : 1, transitionDelay: isThisEventTransitioning ? '0ms' : '300ms' }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <p className="text-slate-200 font-semibold uppercase tracking-widest">{event.display_date}</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mt-2 drop-shadow-lg">{event.title}</h1>
        </div>
      </div>
    </div>
  );

  const BackToEventsButton = () => (
     <div className="mt-16 text-center">
        <Link to="/events" className="inline-flex items-center bg-transparent border-2 border-accent text-accent font-semibold py-3 px-8 rounded-full hover:bg-accent hover:text-accent-text transition-all duration-300 transform hover:scale-105">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to All Events
        </Link>
      </div>
  );

  const WinnerDisplay: React.FC<{ winner?: string, rank: string, color: string }> = ({ winner, rank, color }) => {
    if (!winner) return null;
    return (
      <div className="flex items-center p-2">
        <TrophyIcon className={`w-6 h-6 mr-4 flex-shrink-0 ${color}`} />
        <div>
          <p className="font-bold text-lg text-text-primary">{winner}</p>
          <p className="text-sm text-text-secondary">{rank}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title={`${event.title} | DCCC Events`} />
      <Banner />
      <div
        key={event.id}
        className="transition-opacity duration-500"
        style={{ opacity: isThisEventTransitioning ? 0 : 1 }}
      >
        {event.status === 'past' ? (
          // PAST EVENT LAYOUT
          <SectionWrapper className="!pt-12">
            <div className="max-w-4xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 text-center">About the Event</h2>
                <div className="prose max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: event.description }} />
              </div>
              
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-text-primary text-center mb-6">Competition Winners</h3>
                <div className="space-y-2">
                  {event.segments.map((segment, index) => (
                    <Accordion key={index} title={segment.name}>
                      <div className="space-y-2">
                        <WinnerDisplay winner={segment.winners?.champion} rank="Champion" color="text-yellow-400" />
                        <WinnerDisplay winner={segment.winners?.runner_up} rank="Runner-up" color="text-gray-400" />
                        <WinnerDisplay winner={segment.winners?.second_runner_up} rank="2nd Runner-up" color="text-orange-400" />
                        {!segment.winners?.champion && <p className="p-2 text-text-secondary">Winners not announced.</p>}
                      </div>
                    </Accordion>
                  ))}
                </div>
              </div>

              {event.more_buttons && event.more_buttons.length > 0 && (
                <div className="mt-12 flex flex-wrap justify-center gap-4">
                    {event.more_buttons.map((button, index) => (
                        <a
                            key={index}
                            href={button.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-accent text-accent-text font-semibold py-2 px-6 rounded-full hover:bg-accent-hover transition-transform transform hover:scale-105 duration-300"
                        >
                            {button.text}
                        </a>
                    ))}
                </div>
              )}

              <div className="mt-12 text-center">
                <p className="text-xl font-semibold text-text-secondary italic">This event has concluded.</p>
              </div>

              <BackToEventsButton />
            </div>
          </SectionWrapper>
        ) : (
          // UPCOMING EVENT LAYOUT
          <SectionWrapper className="!pt-12">
             <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
                <div className="lg:col-span-2">
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-text-primary mb-4">About the Event</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
                    </div>
                     <div>
                        <h2 className="text-3xl font-bold text-text-primary mb-6">Event Segments</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {event.segments.map((segment, index) => (
                                <div key={index} className="bg-card-bg backdrop-blur-sm border border-border-color rounded-lg p-4 text-center group transition-all duration-300 hover:bg-accent/10 hover:border-accent/30">
                                    <p className="font-semibold text-text-secondary group-hover:text-accent transition-colors duration-300">{segment.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 mt-12 lg:mt-0">
                    <div className="lg:sticky lg:top-32">
                        <div className="space-y-4 bg-card-bg backdrop-blur-md p-6 rounded-xl border border-border-color">
                            <a 
                            href={event.registration_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-block text-center bg-dccc-red text-white font-semibold py-3 px-8 rounded-full hover:bg-dccc-red-hover transition-transform transform hover:scale-105 duration-300 animate-pulse-red"
                            >
                            Register Now
                            </a>
                            <a 
                            href={generateGoogleCalendarLink(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center bg-transparent border-2 border-accent text-accent font-semibold py-3 px-8 rounded-full hover:bg-accent hover:text-accent-text transition-all duration-300 transform hover:scale-105"
                            >
                            <CalendarIcon className="w-5 h-5 mr-2" />
                            Add to Calendar
                            </a>
                            
                            {event.more_buttons?.map((button, index) => (
                                <a
                                    key={index}
                                    href={button.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center bg-transparent border-2 border-accent text-accent font-semibold py-3 px-8 rounded-full hover:bg-accent hover:text-accent-text transition-all duration-300 transform hover:scale-105"
                                >
                                    {button.text}
                                </a>
                            ))}

                            <div className="pt-4 mt-4 border-t border-border-color">
                            <h3 className="font-bold text-lg text-text-primary mb-3">Event Details</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                <CalendarIcon className="w-5 h-5 mr-3 text-accent mt-1 flex-shrink-0" />
                                <span className="text-text-secondary">{event.display_date}</span>
                                </li>
                                <li className="flex items-start">
                                <ClockIcon className="w-5 h-5 mr-3 text-accent mt-1 flex-shrink-0" />
                                <span className="text-text-secondary">{getTime(event.start_date)}</span>
                                </li>
                                {event.venue && (
                                <li className="flex items-start">
                                    <LocationMarkerIcon className="w-5 h-5 mr-3 text-accent mt-1 flex-shrink-0" />
                                    <span className="text-text-secondary">{event.venue}</span>
                                </li>
                                )}
                                {event.guest && (
                                <li className="flex items-start">
                                    <UserCircleIcon className="w-5 h-5 mr-3 text-accent mt-1 flex-shrink-0" />
                                    <span className="text-text-secondary">
                                        <span className="font-semibold text-text-primary">{event.guest.name}</span>
                                        <br />
                                        {event.guest.title}
                                    </span>
                                </li>
                                )}
                            </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <BackToEventsButton />
          </SectionWrapper>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;