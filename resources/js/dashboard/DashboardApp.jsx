import React, { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import OverviewPage from './pages/OverviewPage';
import RecordsPage from './pages/RecordsPage';
import BudgetPage from './pages/BudgetPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetPlanningPage from './pages/BudgetPlanningPage';
import SettingsModal from './components/SettingsModal';
import { formatApiErrors } from '../constants/sheetDefaults';

export default function DashboardApp(props) {
    const [activeNav, setActiveNav] = useState(() => {
        const savedNav = localStorage.getItem('dashboard-active-nav');
        return savedNav || 'dashboard';
    });
    const [settingsOpen, setSettingsOpen] = useState(props.flash?.openSettings || false);
    const [user, setUser] = useState(props.user);
    const [stats, setStats] = useState(props.stats);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        localStorage.setItem('dashboard-active-nav', activeNav);
    }, [activeNav]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="dashboard">
            <Sidebar
                logo={props.logo}
                activeNav={activeNav}
                onNavChange={setActiveNav}
                routes={props.routes}
                isMobile={isMobile}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
            <div className="dashboard-main">
                <Topbar
                    user={user}
                    defaultAvatar={props.defaultAvatar}
                    onOpenSettings={() => setSettingsOpen(true)}
                    routes={props.routes}
                />
                <div className="dashboard-content">
                    {activeNav === 'dashboard' && (
                        <OverviewPage
                            user={user}
                            stats={stats}
                            onStatsUpdate={setStats}
                        />
                    )}
                    {activeNav === 'records' && (
                        <RecordsPage
                            onStatsUpdate={setStats}
                        />
                    )}
                    {activeNav === 'budget' && (
                        <BudgetPage
                            onStatsUpdate={setStats}
                        />
                    )}
                    {activeNav === 'accounts' && (
                        <AccountsPage
                            onStatsUpdate={setStats}
                        />
                    )}
                    {activeNav === 'categories' && (
                        <CategoriesPage
                            onStatsUpdate={setStats}
                        />
                    )}
                    {activeNav === 'budget_planning' && (
                        <BudgetPlanningPage
                            user={user}
                            stats={stats}
                            onStatsUpdate={setStats}
                        />
                    )}
                </div>
            </div>
            <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                user={user}
                routes={props.routes}
                errors={props.errors}
                old={props.old}
                onUserUpdated={setUser}
            />
        </div>
    );
}
