import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import MediaLibrary from '../components/admin/MediaLibrary';

interface Props {
  onLogout: () => void;
}

const AdminMediaLibraryPage: React.FC<Props> = ({ onLogout }) => {
  return (
    <AdminLayout onLogout={onLogout}>
      <MediaLibrary />
    </AdminLayout>
  );
};

export default AdminMediaLibraryPage;
