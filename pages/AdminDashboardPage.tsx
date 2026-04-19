import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  return (
    <AdminLayout onLogout={onLogout}>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-text-secondary">Welcome to the Dhaka College Cultural Club admin panel.</p>
      <p className="text-text-secondary mt-2">Please select a section from the sidebar to begin editing the website's content.</p>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
