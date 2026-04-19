import React, { ReactNode, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface AdminLayoutProps {
  onLogout: () => void;
  children: ReactNode;
}

const AdminSidebarContent: React.FC<{ onLogout: () => void; onLinkClick?: () => void }> = ({ onLogout, onLinkClick }) => (
    <>
        <div className="p-4">
            <h1 className="text-xl font-bold mb-8 px-4 text-text-primary">DCCC Admin</h1>
        </div>
        <nav className="flex-grow px-4">
            <ul>
                <li><AdminNavLink to="/admin/dashboard" onClick={onLinkClick}>Dashboard</AdminNavLink></li>
                <li><AdminNavLink to="/admin/hero" onClick={onLinkClick}>Hero Section</AdminNavLink></li>
                <li><AdminNavLink to="/admin/about" onClick={onLinkClick}>About Page</AdminNavLink></li>
                <li><AdminNavLink to="/admin/departments" onClick={onLinkClick}>Departments</AdminNavLink></li>
                <li><AdminNavLink to="/admin/events" onClick={onLinkClick}>Events</AdminNavLink></li>
                <li><AdminNavLink to="/admin/panels" onClick={onLinkClick}>Panels</AdminNavLink></li>
                <li><AdminNavLink to="/admin/media" onClick={onLinkClick}>Media Library</AdminNavLink></li>
                <li><AdminNavLink to="/admin/footer" onClick={onLinkClick}>Footer</AdminNavLink></li>
                <li><AdminNavLink to="/admin/theme" onClick={onLinkClick}>Theme</AdminNavLink></li>
            </ul>
        </nav>
        <div className="p-4 border-t border-border-color">
            <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-text-secondary">Theme</span>
                <ThemeToggle />
            </div>
            <Link to="/" target="_blank" className="block text-center w-full mb-2 px-4 py-2 border border-accent text-accent rounded-md hover:bg-accent hover:text-accent-text transition-colors">View Site</Link>
            <button onClick={onLogout} className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Logout</button>
        </div>
    </>
);


const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-text-primary">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card-bg border-r border-border-color flex-col flex-shrink-0 hidden md:flex">
        <AdminSidebarContent onLogout={onLogout} />
      </aside>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
          <aside className={`absolute top-0 left-0 h-full w-64 bg-card-bg border-r border-border-color flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <AdminSidebarContent onLogout={onLogout} onLinkClick={() => setIsSidebarOpen(false)} />
          </aside>
      </div>

      <div className="flex-grow flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-card-bg/80 backdrop-blur-md border-b border-border-color">
            <h1 className="text-lg font-bold">DCCC Admin</h1>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
        </header>
        
        <main className="flex-grow p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminNavLink: React.FC<{ to: string, children: ReactNode, onClick?: () => void }> = ({ to, children, onClick }) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => `block px-4 py-2 rounded-md hover:bg-accent/10 transition-colors duration-200 ${isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-text-secondary font-medium'}`}
  >
    {children}
  </NavLink>
);

export default AdminLayout;