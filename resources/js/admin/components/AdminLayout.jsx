import React, { useState, useEffect, useRef } from 'react';
import {
    DashboardOutlined, UserOutlined, WalletOutlined, AppstoreOutlined,
    AuditOutlined, TransactionOutlined
} from '@ant-design/icons';

const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
    { key: 'users', label: 'Users', icon: <UserOutlined /> },
    { key: 'transactions', label: 'Transactions', icon: <TransactionOutlined /> },
    { key: 'budget-plans', label: 'Budget Plans', icon: <WalletOutlined /> },
    { key: 'categories', label: 'Categories', icon: <AppstoreOutlined /> },
    { key: 'activity-logs', label: 'Activity Logs', icon: <AuditOutlined /> },
];

export default function AdminLayout({ children, currentPage, onNavigate, sidebarOpen, onToggleSidebar, onLogout, theme, onToggleTheme, userName }) {
    const [mobile, setMobile] = useState(window.innerWidth <= 767);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const onResize = () => setMobile(window.innerWidth <= 767);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const onDocClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const sidebarClasses = `admin-sidebar ${mobile && sidebarOpen ? 'admin-sidebar--open' : ''} ${mobile ? 'admin-sidebar--mobile' : ''}`;

    return (
        <div className="admin-layout">
            <div className={`overlay ${sidebarOpen ? 'active' : ''}`} onClick={onToggleSidebar} />
            <div className="admin-sidebar-wrapper">
                <aside className={sidebarClasses}>
                    <div className="sidebar__brand">
                        <a href="/adminportal">
                            <img src="/img/EPAWNlogo.png" alt="Epawn" />
                        </a>
                    </div>
                    <div className="sidebar__content">
                        <nav className="sidebar__nav">
                            <hr className="sidebar__separator" />
                            <div className="sidebar__label">Main Menu</div>
                            <ul>
                                {navItems.map((item) => (
                                    <li key={item.key}>
                                        <button
                                            className={`sidebar__link ${currentPage === item.key ? 'sidebar__link--active' : ''}`}
                                            onClick={() => onNavigate(item.key)}
                                        >
                                            <span className="admin-sidebar__link-icon">{item.icon}</span>
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </aside>
            </div>
            <div className="admin-main-wrap">
                <header className="topbar">
                    <div className="topbar__title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button className={`sidebar-toggle ${mobile ? 'outside' : 'inside'}`} onClick={onToggleSidebar} aria-label="Toggle sidebar">
                                <span className={`toggle-icon ${sidebarOpen ? 'rotate' : ''}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                                </span>
                            </button>
                            <h1>Admin Portal</h1>
                        </div>
                        <p>Epawn Administration</p>
                    </div>
                    <div className="topbar__right">
                        <button type="button" className="admin-topbar__theme-btn" onClick={onToggleTheme} title="Toggle theme">
                            {theme === 'dark' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                            )}
                        </button>
                        <div className="topbar__profile" ref={dropdownRef}>
                            <button type="button" className="topbar__profile-btn" onClick={() => setDropdownOpen((v) => !v)}>
                                <span className="topbar__avatar">{userName?.[0]?.toUpperCase()}</span>
                                <span className="topbar__username">{userName}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                            </button>
                            {dropdownOpen && (
                                <div className="topbar__dropdown">
                                    <div className="topbar__dropdown-header">
                                        <span className="topbar__avatar">{userName?.[0]?.toUpperCase()}</span>
                                        <div>
                                            <strong>{userName}</strong>
                                            <span>Administrator</span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={onLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="admin-main">{children}</main>
            </div>
        </div>
    );
}
