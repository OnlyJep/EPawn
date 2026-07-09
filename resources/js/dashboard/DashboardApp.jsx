import React, { useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
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
    const [isMobile, setIsMobile] = useState(false);
    const [txModalOpen, setTxModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('dashboard-active-nav', activeNav);
    }, [activeNav]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <App>
            <div className="dashboard">
                {!isMobile && (
                    <Sidebar
                        logo={props.logo}
                        user={user}
                        defaultAvatar={props.defaultAvatar}
                        activeNav={activeNav}
                        onNavChange={setActiveNav}
                        routes={props.routes}
                    />
                )}
                <div className="dashboard-main">
                    <Topbar
                        user={user}
                        defaultAvatar={props.defaultAvatar}
                        onOpenSettings={() => setSettingsOpen(true)}
                        routes={props.routes}
                        csrf={props.csrf}
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
                                onTxModalOpenChange={setTxModalOpen}
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
                    defaultAvatar={props.defaultAvatar}
                    routes={props.routes}
                    errors={props.errors}
                    old={props.old}
                    onUserUpdated={setUser}
                />
                {isMobile && !txModalOpen && (
                    <BottomNav
                        activeNav={activeNav}
                        onNavChange={setActiveNav}
                    />
                )}
            </div>
        </App>
    );
}
