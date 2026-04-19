

import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import ThemeInjector from './components/ThemeInjector';
import { PageTransitionProvider, usePageTransition } from './contexts/PageTransitionContext';
import PageTransitionLoader from './components/PageTransitionLoader';
import { SharedTransitionProvider, useSharedTransition } from './contexts/SharedTransitionContext';
import SharedTransitionElement from './components/SharedTransitionElement';
import { ToastProvider } from './contexts/ToastContext';
import AdminSaveToast from './components/admin/AdminSaveToast';

// Skeletons (imported directly for Suspense fallback)
import HomePageSkeleton from './components/skeletons/HomePageSkeleton';
import AboutPageSkeleton from './components/skeletons/AboutPageSkeleton';
import DepartmentsPageSkeleton from './components/skeletons/DepartmentsPageSkeleton';
import DepartmentDetailPageSkeleton from './components/skeletons/DepartmentDetailPageSkeleton';
import EventsPageSkeleton from './components/skeletons/EventsPageSkeleton';
import EventDetailPageSkeleton from './components/skeletons/EventDetailPageSkeleton';
import PanelsPageSkeleton from './components/skeletons/PanelsPageSkeleton';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const DepartmentDetailPage = lazy(() => import('./pages/DepartmentDetailPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const PanelsPage = lazy(() => import('./pages/PanelsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const JoinAdminPage = lazy(() => import('./pages/JoinAdminPage'));


// This component ensures that navigation scrolls the user to the top of the page.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Layout for the public-facing website (includes Header and Footer)
const PublicSiteLayout: React.FC = () => {
  const { pathname } = useLocation();
  const { setIsLoading } = usePageTransition();
  const { transitionState } = useSharedTransition();
  const isInitialLoad = useRef(true);

  // Effect to handle page transition loading screen
  useEffect(() => {
    // Disable default loader if a shared element transition is active
    if (transitionState.isTransitioning) {
      setIsLoading(false);
      return;
    }
    
    // Don't show loader on the initial page load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600); // Duration for the loader

    return () => clearTimeout(timer);
  }, [pathname, setIsLoading, transitionState.isTransitioning]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Child routes like HomePage, AboutPage, etc., will be rendered here */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const FullPageLoader: React.FC = () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <img src="https://dhakacollegeculturalclub.com/logo.png" alt="Loading..." className="h-16 w-16 animate-pulse" />
    </div>
);


// The main App component that sets up providers and routing.
const App: React.FC = () => {
  const basename = (window as any).APP_BASENAME || '/';
  
  return (
    <ThemeProvider>
      <DataProvider>
        <PageTransitionProvider>
          <ToastProvider>
            <BrowserRouter basename={basename}>
              <SharedTransitionProvider>
                {/* Global components that need to be inside the Router context */}
                <ThemeInjector />
                <ScrollToTop />
                <PageTransitionLoader />
                <SharedTransitionElement />
                <AdminSaveToast />

                <Routes>
                  {/* Admin panel routes */}
                  <Route path="/admin/*" element={<Suspense fallback={<FullPageLoader />}><AdminPage /></Suspense>} />
                  <Route path="/join-admin/*" element={<Suspense fallback={<FullPageLoader />}><JoinAdminPage /></Suspense>} />

                  {/* Public website routes with a shared layout */}
                  <Route path="/" element={<PublicSiteLayout />}>
                    <Route index element={<Suspense fallback={<HomePageSkeleton />}><HomePage /></Suspense>} />
                    <Route path="about" element={<Suspense fallback={<AboutPageSkeleton />}><AboutPage /></Suspense>} />
                    <Route path="departments" element={<Suspense fallback={<DepartmentsPageSkeleton />}><DepartmentsPage /></Suspense>} />
                    <Route path="departments/:id" element={<Suspense fallback={<DepartmentDetailPageSkeleton />}><DepartmentDetailPage /></Suspense>} />
                    <Route path="events" element={<Suspense fallback={<EventsPageSkeleton />}><EventsPage /></Suspense>} />
                    <Route path="events/:id" element={<Suspense fallback={<EventDetailPageSkeleton />}><EventDetailPage /></Suspense>} />
                    <Route path="panels" element={<Suspense fallback={<PanelsPageSkeleton />}><PanelsPage /></Suspense>} />
                    <Route path="join" element={<Suspense fallback={<FullPageLoader />}><JoinPage /></Suspense>} />
                  </Route>
                </Routes>
              </SharedTransitionProvider>
            </BrowserRouter>
          </ToastProvider>
        </PageTransitionProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;