import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Event } from '../../types';
import SectionWrapper from '../SectionWrapper';

const CircularUnit: React.FC<{ value: number; label: string; maxValue: number }> = ({ value, label, maxValue }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  // Ensure progress doesn't go below 0 or above 1
  const progress = Math.max(0, Math.min(1, value / maxValue));
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center w-24 md:w-28 text-center">
      <div className="relative w-24 h-24 md:w-28 md:h-28">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--border-color)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-300 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl md:text-3xl font-bold text-text-primary">{value.toString().padStart(2, '0')}</span>
        </div>
      </div>
      <p className="text-sm font-semibold uppercase mt-3 text-text-secondary tracking-widest">{label}</p>
    </div>
  );
};

const UpcomingEventCountdown: React.FC = () => {
  const { data } = useData();
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [initialDays, setInitialDays] = useState(30);

  useEffect(() => {
    if (data?.events) {
      const upcomingEvents = data.events
        .filter(e => e.status === 'upcoming' && new Date(e.start_date) > new Date())
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      
      if (upcomingEvents.length > 0) {
        const event = upcomingEvents[0];
        setNextEvent(event);

        // Calculate initial days for a more meaningful progress bar
        const initialDifference = +new Date(event.start_date) - +new Date();
        const days = Math.floor(initialDifference / (1000 * 60 * 60 * 24));
        setInitialDays(days > 0 ? days : 1); // Avoid max value of 0
      }
    }
  }, [data]);

  useEffect(() => {
    if (!nextEvent) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(nextEvent.start_date) - +new Date();
      let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeft;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [nextEvent]);

  if (!nextEvent || !timeLeft) {
    return null;
  }

  return (
    <SectionWrapper id="countdown">
      <div className="bg-card-bg backdrop-blur-md border border-border-color rounded-3xl shadow-xl shadow-black/10 dark:shadow-black/20 max-w-4xl mx-auto p-8 md:p-12 text-center">
        <h2 className="text-lg md:text-xl font-semibold text-text-secondary mb-2 uppercase tracking-wider">Next Event In</h2>
        <h3 className="text-3xl md:text-5xl font-bold text-dccc-red mb-8 drop-shadow-sm">{nextEvent.title}</h3>
        
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-10">
          <CircularUnit value={timeLeft.days} label="Days" maxValue={initialDays} />
          <CircularUnit value={timeLeft.hours} label="Hours" maxValue={24} />
          <CircularUnit value={timeLeft.minutes} label="Minutes" maxValue={60} />
          <CircularUnit value={timeLeft.seconds} label="Seconds" maxValue={60} />
        </div>
        
        <Link to={`/events/${nextEvent.id}`} className="inline-block bg-accent text-accent-text font-semibold py-3 px-8 rounded-full hover:bg-accent-hover transition-transform transform hover:scale-105 duration-300 animate-pulse-accent">
          View Event Details
        </Link>
      </div>
    </SectionWrapper>
  );
};

export default UpcomingEventCountdown;