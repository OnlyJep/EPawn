import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetPlansPage from './pages/BudgetPlansPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import TransactionsPage from './pages/TransactionsPage';
import { getStoredTheme, applyTheme } from '../services/theme';

export default function AdminApp() {
    const [authenticated, setAuthenticated] = useState(null);
    const [page, setPage] = useState('dashboard');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [themeMode, setThemeMode] = useState(() => getStoredTheme());

    const toggleTheme = () => {
        const next = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
        applyTheme(next);
    };

    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch('/admin/check');
            if (res.ok) setAuthenticated(true);
            else setAuthenticated(false);
        } catch { setAuthenticated(false); }
    }, []);

    useEffect(() => { checkAuth(); }, [checkAuth]);

    const antdThemeConfig = {
        algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
            colorPrimary: '#C62828',
            colorError: '#C62828',
            borderRadius: 10,
            fontFamily: 'Montserrat, sans-serif',
        },
    };

    if (authenticated === null) {
        return (
            <div className="admin-loading">
                <div className="admin-loading__spinner" />
            </div>
        );
    }

    if (!authenticated) {
        return <LoginPage onLogin={() => checkAuth()} theme={themeMode} onToggleTheme={toggleTheme} />;
    }

    const navigateTo = (p) => { setPage(p); setSelectedUserId(null); setSidebarOpen(false); };
    const viewUser = (id) => { setSelectedUserId(id); setPage('user-detail'); setSidebarOpen(false); };

    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage />;
            case 'users': return <UsersPage onViewUser={viewUser} />;
            case 'user-detail': return <UserDetailPage userId={selectedUserId} onBack={() => navigateTo('users')} />;
            case 'transactions': return <TransactionsPage />;
            case 'categories': return <CategoriesPage />;
            case 'budget-plans': return <BudgetPlansPage />;
            case 'activity-logs': return <ActivityLogsPage />;
            default: return <DashboardPage />;
        }
    };

    return (
        <ConfigProvider theme={antdThemeConfig}>
            <div className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
            <AdminLayout
                currentPage={page}
                onNavigate={navigateTo}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
                onLogout={() => {
                    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
                    fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf } }).then(() => setAuthenticated(false));
                }}
                theme={themeMode}
                onToggleTheme={toggleTheme}
                userName="Admin"
            >
                <div className="admin-main__header">
                    <button className="admin-hamburger" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
                        <span /><span /><span />
                    </button>
                </div>
                {renderPage()}
            </AdminLayout>
        </ConfigProvider>
    );
}
