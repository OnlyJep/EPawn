import React from 'react';
import { createRoot } from 'react-dom/client';
import EpawnApp from './EpawnApp';

const rootEl = document.getElementById('root');

if (rootEl) {
    const d = rootEl.dataset;
    const props = {};

    if (d.user) {
        try { props.user = JSON.parse(d.user); } catch (e) { props.user = null; }
    }
    if (d.routes) {
        try { props.routes = JSON.parse(d.routes); } catch (e) { props.routes = {}; }
    }
    if (d.errors) {
        try { props.errors = JSON.parse(d.errors); } catch (e) { props.errors = {}; }
    }
    if (d.old) {
        try { props.old = JSON.parse(d.old); } catch (e) { props.old = {}; }
    }

    props.logo = d.logo;
    props.csrf = d.csrf;
    props.openModal = d.openModal || '';
    props.year = d.year ? parseInt(d.year, 10) : new Date().getFullYear();

    createRoot(rootEl).render(React.createElement(EpawnApp, props));
} else {
    console.error('Root element not found');
}
