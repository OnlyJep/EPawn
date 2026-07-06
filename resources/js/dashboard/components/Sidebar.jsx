import React from 'react';

function NavIcon({ type }) {
    const icons = {
        dashboard: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />,
        budget: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
        sheet: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        accounts: <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
        categories: <path d="M7 7h.01M6 20v-3a1 1 0 00-1-1H2m13-8h6m-6 4h6m-6 4h6M9 3H4a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V4a1 1 0 00-1-1zm0 10H4a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-5a1 1 0 00-1-1z" />,
        planning: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    };

    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[type] || icons.sheet}
        </svg>
    );
}

export default function Sidebar({
    logo,
    user,
    defaultAvatar,
    activeNav,
    onNavChange,
    routes,
}) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <a href={routes.home}>
                    <img src={logo} alt="E-PAWN" />
                </a>
            </div>
            <hr className="sidebar-separator" />
            <div className="sidebar-content">
                <nav className="sidebar-nav">
                    <p className="sidebar-label">Menu</p>
                    <ul>
                        <li>
                            <button
                                type="button"
                                className={`sidebar-link${activeNav === 'dashboard' ? ' sidebar-link--active' : ''}`}
                                onClick={() => onNavChange('dashboard')}
                            >
                                <NavIcon type="dashboard" />
                                <span>Dashboard</span>
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`sidebar-link${activeNav === 'records' ? ' sidebar-link--active' : ''}`}
                                onClick={() => onNavChange('records')}
                            >
                                <NavIcon type="sheet" />
                                <span>Records</span>
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`sidebar-link${activeNav === 'budget_planning' ? ' sidebar-link--active' : ''}`}
                                onClick={() => onNavChange('budget_planning')}
                            >
                                <NavIcon type="planning" />
                                <span>Budget Planning</span>
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`sidebar-link${activeNav === 'budget' ? ' sidebar-link--active' : ''}`}
                                onClick={() => onNavChange('budget')}
                            >
                                <NavIcon type="budget" />
                                <span>Budget</span>
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`sidebar-link${activeNav === 'accounts' ? ' sidebar-link--active' : ''}`}
                                onClick={() => onNavChange('accounts')}
                            >
                                <NavIcon type="accounts" />
                                <span>Accounts</span>
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className={`sidebar-link${activeNav === 'categories' ? ' sidebar-link--active' : ''}`}
                                onClick={() => onNavChange('categories')}
                            >
                                <NavIcon type="categories" />
                                <span>Categories</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
