import React from 'react';
import { createRoot } from 'react-dom/client';
import DashboardApp from './DashboardApp';
import { loadDashboard, getCachedDashboard } from '../services/epawnApi';
import { getEpawn } from '../services/epawnStorage';
import { initTheme } from '../services/theme';

initTheme();

const rootEl = document.getElementById('dashboard-root');

async function initDashboard() {
    const cached = getCachedDashboard() || getEpawn().dashboard;
    const user = getEpawn().user;

    try {
        const data = await loadDashboard();
        createRoot(rootEl).render(React.createElement(DashboardApp, data));
    } catch (error) {
        if (error?.response?.status === 401) {
            window.location.href = '/';
            return;
        }

        if (cached && user) {
            createRoot(rootEl).render(React.createElement(DashboardApp, cached));
        } else {
            window.location.href = '/';
        }
    }
}

initDashboard();
