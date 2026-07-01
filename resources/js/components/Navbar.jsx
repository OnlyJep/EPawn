import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ user, logo, routes, csrf, onOpenModal, theme, onToggleTheme }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navRef = useRef(null);
    const logoutFormRef = useRef(null);
    const dashboardUrl = routes.dashboard;
    const currentPath = window.location.pathname;

    // Scroll shadow effect
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close on outside click
    useEffect(() => {
        if (!mobileOpen) return;
        const handler = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setMobileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [mobileOpen]);

    // Close menu on route link click (mobile)
    const handleNavLink = () => setMobileOpen(false);

    const handleLogout = (e) => {
        e.preventDefault();
        if (logoutFormRef.current) {
            logoutFormRef.current.submit();
        }
    };

    const navLinks = [
        { href: routes.features, label: 'Features' },
        { href: routes.howItWorks, label: 'How It Works' },
        { href: routes.about, label: 'About' },
    ];

    const isActive = (href) => href && currentPath === href;

    return (
        <nav
            ref={navRef}
            className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}
        >
            <div className="navbar-inner">
                {/* Logo */}
                <a href={routes.home} className="nav-logo">
                    <img src={logo} alt="E-PAWN Logo" />
                </a>

                {/* Desktop Nav Links */}
                <ul className="nav-links">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                className={isActive(link.href) ? 'nav-link--active' : ''}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* Desktop Actions */}
                <div className="nav-actions">
                    <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                    {user ? (
                        <>
                            <a href={dashboardUrl} className="btn btn-primary">Dashboard</a>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn-outline" onClick={() => onOpenModal('login')}>Log In</button>
                            <button type="button" className="btn btn-primary" onClick={() => onOpenModal('register')}>Register</button>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    type="button"
                    className="mobile-toggle"
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((o) => !o)}
                >
                    {mobileOpen ? (
                        // X icon
                        <svg width="24" height="24" fill="none" stroke="#C62828" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    ) : (
                        // Hamburger icon
                        <svg width="24" height="24" fill="none" stroke="#C62828" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Drawer */}
            <div className={`mobile-menu${mobileOpen ? ' mobile-menu--open' : ''}`}>
                <ul className="mobile-nav-links">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                className={isActive(link.href) ? 'nav-link--active' : ''}
                                onClick={handleNavLink}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="mobile-nav-actions">
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
                        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                    </div>
                    {user ? (
                        <>
                            <a href={dashboardUrl} className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                                Dashboard
                            </a>
                            <button
                                type="button"
                                className="btn btn-outline"
                                style={{ width: '100%' }}
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={() => { onOpenModal('login'); setMobileOpen(false); }}>
                                Log In
                            </button>
                            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => { onOpenModal('register'); setMobileOpen(false); }}>
                                Register
                            </button>
                        </>
                    )}
                </div>
            </div>
            <form ref={logoutFormRef} method="POST" action="/logout" style={{ display: 'none' }}>
                <input type="hidden" name="_token" value={csrf} />
            </form>
        </nav>
    );
}
