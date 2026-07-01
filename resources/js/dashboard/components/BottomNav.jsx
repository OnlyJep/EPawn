import React from 'react';

function NavIcon({ type }) {
    const icons = {
        dashboard: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />,
        records: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        budget_planning: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
        budget: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
        accounts: <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
        categories: <path d="M7 7h.01M6 20v-3a1 1 0 00-1-1H2m13-8h6m-6 4h6m-6 4h6M9 3H4a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V4a1 1 0 00-1-1zm0 10H4a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-5a1 1 0 00-1-1z" />,
    };

    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[type] || icons.records}
        </svg>
    );
}

const items = [
    { key: 'dashboard', label: 'Home' },
    { key: 'records', label: 'Records' },
    { key: 'budget_planning', label: 'Plans' },
    { key: 'budget', label: 'Budget' },
    { key: 'accounts', label: 'Accounts' },
    { key: 'categories', label: 'Categories' },
];

export default function BottomNav({ activeNav, onNavChange }) {
    return (
        <nav className="bottom-nav">
            {items.map(item => {
                const isActive = activeNav === item.key;
                return (
                    <button
                        key={item.key}
                        type="button"
                        className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
                        onClick={() => onNavChange(item.key)}
                    >
                        <NavIcon type={item.key} />
                        <span className="bottom-nav__label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
