import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { useSharedTransition } from '../contexts/SharedTransitionContext';

const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const isPast = event.status === 'past';
  const { startTransition } = useSharedTransition();
  const imageRef = useRef<HTMLImageElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    // This handler is only for the `a` tag on upcoming events.
    if (!imageRef.current) return;
    
    e.preventDefault();
    startTransition(imageRef.current, event.banner_url, `/events/${event.id}`);
  };

  const CardContent = (
    <div className={`block group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-black/20 dark:hover:shadow-black/40 transition-all duration-300 transform hover:-translate-y-1 ${isPast ? 'opacity-60 grayscale' : ''}`}>
      <div className="relative">
        <img ref={imageRef} src={event.banner_url} alt={event.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        {isPast && (
          <div className="absolute top-3 right-3 bg-slate-800/70 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">
            Completed
          </div>
        )}
      </div>
      <div className="p-5 bg-card-bg backdrop-blur-md border-t border-border-color">
        <p className="text-sm text-red-500 dark:text-dccc-red font-semibold">{event.display_date}</p>
        <h3 className="mt-1 text-xl font-bold text-text-primary truncate group-hover:text-accent transition-colors duration-300">{event.title}</h3>
        <p className="mt-2 text-sm text-text-secondary line-clamp-2">{stripHtml(event.description)}</p>
      </div>
    </div>
  );
  
  // Past events navigate normally without the transition effect.
  if (isPast) {
    return (
      <Link to={`/events/${event.id}`} className="block">
        {CardContent}
      </Link>
    );
  }

  // Upcoming events use an anchor with a click handler to trigger the transition.
  return (
    <a href={`/events/${event.id}`} onClick={handleClick} className="block">
      {CardContent}
    </a>
  );
};

export default EventCard;