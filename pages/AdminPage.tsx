import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from '../services/firebase';

// Import pages
import AdminLoginPage from './AdminLoginPage';
import AdminDashboardPage from './AdminDashboardPage';
import AdminHeroEditorPage from './AdminHeroEditorPage';
import AdminAboutEditorPage from './AdminAboutEditorPage';
import AdminDepartmentsEditorPage from './AdminDepartmentsEditorPage';
import AdminEventsEditorPage from './AdminEventsEditorPage';
import AdminPanelsEditorPage from './AdminPanelsEditorPage';
import AdminMediaLibraryPage from './AdminMediaLibraryPage';
import AdminFooterEditorPage from './AdminFooterEditorPage';
import AdminThemeEditorPage from './AdminThemeEditorPage';

const AdminPage: React.FC = () => {
  // Use Firebase's user object to track authentication. null means not checked yet.
  const [user, setUser] = useState<any>(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If firebase auth is not initialized, stop loading and show login.
    if (!auth) {
      console.warn("Auth service not available.");
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    if (auth) {
        auth.signOut().catch((error: any) => console.error("Logout failed:", error));
    }
  };
  
  // While checking auth state, show a loading indicator.
  if (loading) {
      return <div className="text-center p-12 min-h-screen flex items-center justify-center">Loading Admin...</div>;
  }

  // If there's no user, show the login page and related routes.
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        {/* Redirect any other admin path to the login page */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  // If there is a user, show the protected admin dashboard and editor pages.
  return (
    <Routes>
      <Route path="/dashboard" element={<AdminDashboardPage onLogout={handleLogout} />} />
      <Route path="/hero" element={<AdminHeroEditorPage onLogout={handleLogout} />} />
      <Route path="/about" element={<AdminAboutEditorPage onLogout={handleLogout} />} />
      <Route path="/departments" element={<AdminDepartmentsEditorPage onLogout={handleLogout} />} />
      <Route path="/events" element={<AdminEventsEditorPage onLogout={handleLogout} />} />
      <Route path="/panels" element={<AdminPanelsEditorPage onLogout={handleLogout} />} />
      <Route path="/media" element={<AdminMediaLibraryPage onLogout={handleLogout} />} />
      <Route path="/footer" element={<AdminFooterEditorPage onLogout={handleLogout} />} />
      <Route path="/theme" element={<AdminThemeEditorPage onLogout={handleLogout} />} />
      {/* If an authenticated user lands on /admin/login or any other admin path, redirect to dashboard */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminPage;