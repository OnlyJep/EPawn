import React, { useEffect, useRef, useState } from 'react';
import { clearEpawn } from '../../services/epawnStorage';
import ThemeToggle from '../../components/ThemeToggle';
import { getStoredTheme, applyTheme } from '../../services/theme';

export default function Topbar({ user, defaultAvatar, onOpenSettings, routes, csrf }) {
    const [open, setOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [theme, setTheme] = useState(() => getStoredTheme());
    const dropdownRef = useRef(null);
    const logoutFormRef = useRef(null);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        applyTheme(next);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayName = user?.fullname || user?.display_name || user?.username;

    const handleLogout = async () => {
        setLoggingOut(true);
        clearEpawn();
        localStorage.removeItem('Epawn');
        if (logoutFormRef.current) {
            logoutFormRef.current.submit();
        }
    };

    return (
        <header className="topbar">
            <div className="topbar__title">
                <h1>Dashboard</h1>
                <p>Welcome back, {displayName}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <div className="topbar__profile" ref={dropdownRef}>
                <button
                    type="button"
                    className="topbar__profile-btn"
                    onClick={() => setOpen((value) => !value)}
                >
                    <img src={defaultAvatar} alt="Profile" className="topbar__avatar" />
                    <span className="topbar__username">@{user?.username}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
                {open && (
                    <div className="topbar__dropdown">
                        <div className="topbar__dropdown-header">
                            <img src={defaultAvatar} alt="Profile" />
                            <div>
                                <strong>{displayName}</strong>
                                <span>{user?.email}</span>
                            </div>
                        </div>
                        <button type="button" onClick={() => { setOpen(false); onOpenSettings(); }}>
                            Settings
                        </button>
                        <button type="button" onClick={handleLogout} disabled={loggingOut}>
                            {loggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                )}
                </div>
            </div>
            <form ref={logoutFormRef} method="POST" action="/logout" style={{ display: 'none' }}>
                <input type="hidden" name="_token" value={csrf} />
            </form>
        </header>
    );
}
