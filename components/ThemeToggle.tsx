import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './icons/ThemeIcons';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full p-2 flex items-center justify-center bg-black/5 dark:bg-white/10 text-text-secondary hover:text-text-primary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-6 h-6">
        <SunIcon className={`absolute inset-0 transition-all duration-300 transform ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
        <MoonIcon className={`absolute inset-0 transition-all duration-300 transform ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
