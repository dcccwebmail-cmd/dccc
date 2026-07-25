import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import ThemeToggle from '../components/ThemeToggle';
import AdminLoginPage from './AdminLoginPage';
import JoinAdminRequests from './JoinAdminRequests';
import JoinAdminOffline from './JoinAdminOffline';
import JoinAdminSettings from './JoinAdminSettings';
import { LogOut, Users, Settings, PlusCircle, RefreshCw } from 'lucide-react';

const JoinAdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab based on current path
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/offline')) return 'offline';
        if (path.includes('/settings')) return 'settings';
        return 'requests';
    };

    const activeTab = getActiveTab();

    return (
        <div className="min-h-screen bg-background text-text-primary p-4 md:p-8">
            {/* Header section with responsive single line layouts */}
            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-card-bg p-4 rounded-xl border border-border-color shadow-sm gap-4 overflow-hidden">
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                    <img 
                        src="https://ik.imagekit.io/dccc/dccc-logo.png" 
                        alt="DCCC" 
                        className="h-10 w-10 object-contain flex-shrink-0" 
                    />
                    <div className="overflow-hidden min-w-0">
                        <h1 className="text-lg md:text-xl font-extrabold truncate whitespace-nowrap text-left" style={{ letterSpacing: '-0.025em' }}>
                            Join Admin Panel
                        </h1>
                        <p className="text-text-secondary text-[11px] font-semibold tracking-wider uppercase text-left">
                            Membership Control Center
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0 border-border-color/50">
                    <ThemeToggle />
                    <button 
                        onClick={onLogout} 
                        className="flex items-center gap-1.5 text-xs text-red-500 font-extrabold hover:text-red-600 uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 rounded-xl transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                    </button>
                </div>
            </header>

            {/* Navigation tabs linking to URL paths */}
            <div className="mb-6 flex space-x-1 p-1 bg-card-bg rounded-xl border border-border-color max-w-2xl">
                <Link 
                    to="/join-admin/requests" 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'requests' ? 'bg-accent text-accent-text font-extrabold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Requests</span>
                </Link>
                <Link 
                    to="/join-admin/offline" 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'offline' ? 'bg-accent text-accent-text font-extrabold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Offline Sales</span>
                </Link>
                <Link 
                    to="/join-admin/settings" 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-accent text-accent-text font-extrabold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Settings</span>
                </Link>
            </div>

            {/* Route mapping for sub-admin-panels */}
            <Routes>
                <Route path="requests" element={<JoinAdminRequests />} />
                <Route path="offline" element={<JoinAdminOffline />} />
                <Route path="settings" element={<JoinAdminSettings />} />
                <Route path="*" element={<Navigate to="requests" replace />} />
            </Routes>
        </div>
    );
};

const JoinAdminPage: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        if (auth) {
            auth.signOut().catch((error: any) => console.error("Logout failed:", error));
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-primary">
                <RefreshCw className="w-8 h-8 animate-spin text-accent mb-3" />
                <span className="text-sm font-semibold text-text-secondary">Authenticating Join Admin...</span>
            </div>
        );
    }

    if (!user) {
        return <AdminLoginPage />;
    }

    return <JoinAdminDashboard onLogout={handleLogout} />;
};

export default JoinAdminPage;
