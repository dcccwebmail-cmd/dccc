import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Database, Image as ImageIcon, Globe, Triangle, GitBranch } from 'lucide-react';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

const connections = [
  { name: 'Firebase', type: 'Database (google)', icon: Database, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { name: 'ImageKit', type: 'Storage (google)', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'Cloudflare', type: 'Domain (google)', icon: Globe, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { name: 'Vercel', type: 'Deploy (google)', icon: Triangle, color: 'text-slate-800 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-slate-800' },
  { name: 'GitHub', type: 'Repo (google)', icon: GitBranch, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
];

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  return (
    <AdminLayout onLogout={onLogout}>
      <div className="flex flex-col h-full min-h-screen">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-text-secondary">Welcome to the Dhaka College Cultural Club admin panel.</p>
          <p className="text-text-secondary mt-2 mb-8">Please select a section from the sidebar to begin editing the website's content.</p>
        </div>

        {/* Connectivity Section */}
        <div className="mt-12 pt-8 border-t border-border-color">
          <h3 className="text-lg font-semibold text-text-primary mb-4">System Connectivity</h3>
          <p className="text-sm text-text-secondary mb-6">Overview of third-party services integrated with this application.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {connections.map((conn) => (
              <div key={conn.name} className="flex items-center p-4 bg-card-bg border border-border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-lg mr-4 ${conn.bg}`}>
                  <conn.icon className={`w-6 h-6 ${conn.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">{conn.name}</h4>
                  <p className="text-xs text-text-secondary">{conn.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
