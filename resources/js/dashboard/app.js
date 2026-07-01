import 'core-js/stable';
import React from 'react';
import { createRoot } from 'react-dom/client';
import DashboardApp from './DashboardApp';
import ErrorBoundary from '../ErrorBoundary';
import LoadingFallback from '../LoadingFallback';
import { loadDashboard, getCachedDashboard } from '../services/epawnApi';
import { getEpawn } from '../services/epawnStorage';
import { initTheme } from '../services/theme';

initTheme();

const rootEl = document.getElementById('dashboard-root');

const fallbackEl = document.createElement('div');
fallbackEl.id = 'dashboard-fallback';
rootEl.parentNode.insertBefore(fallbackEl, rootEl.nextSibling);

const fallbackRoot = createRoot(fallbackEl);
fallbackRoot.render(React.createElement(LoadingFallback));

function cleanup() {
    if (fallbackRoot) {
        fallbackRoot.unmount();
        if (fallbackEl.parentNode) {
            fallbackEl.parentNode.removeChild(fallbackEl);
        }
    }
}

async function initDashboard() {
    const cached = getCachedDashboard() || getEpawn().dashboard;
    const user = getEpawn().user;

    try {
        const data = await loadDashboard();
        cleanup();
        createRoot(rootEl).render(
            React.createElement(ErrorBoundary, null,
                React.createElement(DashboardApp, data)
            )
        );
    } catch (error) {
        cleanup();

        if (error?.response?.status === 401) {
            window.location.href = '/';
            return;
        }

        if (cached && user) {
            createRoot(rootEl).render(
                React.createElement(ErrorBoundary, null,
                    React.createElement(DashboardApp, cached)
                )
            );
            return;
        }

        if (user) {
            createRoot(rootEl).render(
                React.createElement(ErrorBoundary, null,
                    React.createElement('div', {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            padding: '2rem',
                            textAlign: 'center',
                            fontFamily: 'Montserrat, sans-serif',
                            background: '#FAFAFA',
                            color: '#333'
                        }
                    },
                        React.createElement('h2', { style: { marginBottom: '1rem' } }, 'Unable to load dashboard'),
                        React.createElement('p', { style: { marginBottom: '1.5rem', color: '#666' } }, 'Please check your connection and try again.'),
                        React.createElement('button', {
                            onClick: () => window.location.reload(),
                            style: {
                                padding: '0.75rem 2rem',
                                border: 'none',
                                borderRadius: '50px',
                                background: '#dc2626',
                                color: '#fff',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }
                        }, 'Retry')
                    )
                )
            );
        } else {
            window.location.href = '/';
        }
    }
}

initDashboard();
