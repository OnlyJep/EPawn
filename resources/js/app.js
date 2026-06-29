import React from 'react';
import { createRoot } from 'react-dom/client';
import EpawnApp from './EpawnApp';
import { loadBootstrap, getCachedBootstrap } from './services/epawnApi';
import { getEpawn, clearEpawn, setEpawn } from './services/epawnStorage';

const rootEl = document.getElementById('root');

async function initLanding() {
    const cached = getCachedBootstrap() || getEpawn().bootstrap;
    const storedData = getEpawn();

    // Clear localStorage if no valid user data exists
    if (! storedData.user) {
        clearEpawn();
    }

    try {
        const data = await loadBootstrap();

        // Only store bootstrap data if user is authenticated
        if (data.user) {
            setEpawn({
                user: data.user,
                logo: data.logo,
                csrf: data.csrf,
                routes: data.routes,
                bootstrap: data,
                errors: data.errors || {},
                old: data.old || {},
                openModal: data.openModal || '',
                year: data.year,
            });
        } else {
            // Clear localStorage if backend returns no user
            clearEpawn();
        }

        createRoot(rootEl).render(React.createElement(EpawnApp, data));
    } catch {
        if (cached && storedData.user) {
            createRoot(rootEl).render(React.createElement(EpawnApp, cached));
        } else {
            clearEpawn();
            createRoot(rootEl).render(
                React.createElement('div', { className: 'loading' }, 'Unable to load E-PAWN.')
            );
        }
    }
}

initLanding();
