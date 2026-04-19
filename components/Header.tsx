import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import ThemeToggle from './ThemeToggle';

const NavItem: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ to, children, onClick }) => {
  const commonClasses = "block py-1 px-3 text-text-primary dark:text-text-primary rounded-full hover:bg-accent/10 md:hover:bg-transparent md:hover:text-accent transition-colors duration-300 font-bold text-lg";
  const activeClasses = "bg-accent/10 text-accent md:bg-transparent";

  return (
    <NavLink to={to} className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : ''}`} onClick={onClick}>
      {children}
    </NavLink>
  );
};

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data } = useData();
  const heroData = data?.hero;
  const navRef = useRef<HTMLElement>(null);

  // Effect for scroll-based styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Effect to handle closing menu on outside click, scroll, or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleScrollWhileOpen = () => {
        setIsOpen(false);
    };
    
    const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollWhileOpen, { passive: true, once: true });
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollWhileOpen);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);


  const closeMenu = () => setIsOpen(false);
  
  const navBgClass = isScrolled || isOpen 
    ? 'bg-background/80 dark:bg-background/80' 
    : 'bg-background/20 dark:bg-background/20';

  return (
    <header className="fixed w-full z-20 top-0 left-0 p-4">
      <nav ref={navRef} className={`backdrop-blur-xl max-w-4xl mx-auto border border-border-color transition-all duration-500 ${navBgClass} ${isScrolled ? 'shadow-xl shadow-black/20' : ''} ${isOpen ? 'rounded-2xl' : 'rounded-full'}`}>
        <div className="flex items-center justify-between w-full py-2 px-3">
          {/* Left: Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center" onClick={closeMenu}>
            <img src="https://dhakacollegeculturalclub.com/logo.png" className="h-10" alt="DCCC Logo" />
          </Link>
          
          {/* Right: Menus */}
          <div className="flex items-center">
            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-2">
              <ul className="flex flex-row space-x-1">
                <li><NavItem to="/about">About</NavItem></li>
                <li><NavItem to="/departments">Departments</NavItem></li>
                <li><NavItem to="/events">Events</NavItem></li>
                <li><NavItem to="/panels">Panels</NavItem></li>
              </ul>
              {heroData && (
                <a href={heroData.cta_secondary_link} className="bg-dccc-red text-white dark:text-red-950 font-semibold py-2 px-5 rounded-full hover:bg-dccc-red-hover transition-all transform hover:scale-105 duration-300 text-base animate-pulse-red">
                  {heroData.cta_secondary_text}
                </a>
              )}
              <ThemeToggle />
            </div>

            {/* Mobile hamburger button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button onClick={() => setIsOpen(!isOpen)} type="button" className="relative inline-flex items-center justify-center w-10 h-10 text-text-secondary rounded-lg hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-border-color" aria-controls="navbar-mobile" aria-expanded={isOpen}>
                <span className="sr-only">Open main menu</span>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
                    <span className={`block w-6 h-0.5 bg-current my-1.5 transform transition duration-300 ease-in-out ${isOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${isOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu animated inside */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden md:hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <ul className="flex flex-col p-4 pt-2 space-y-6">
            <li><NavItem to="/about" onClick={closeMenu}>About</NavItem></li>
            <li><NavItem to="/departments" onClick={closeMenu}>Departments</NavItem></li>
            <li><NavItem to="/events" onClick={closeMenu}>Events</NavItem></li>
            <li><NavItem to="/panels" onClick={closeMenu}>Panels</NavItem></li>
            {heroData && (
              <li className="mt-2 pt-4 border-t border-border-color">
                <a href={heroData.cta_secondary_link} className="block text-center bg-dccc-red text-white dark:text-red-950 font-semibold py-2 px-4 rounded-full hover:bg-dccc-red-hover transition-transform transform hover:scale-105 duration-300 text-base animate-pulse-red">
                  {heroData.cta_secondary_text}
                </a>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;