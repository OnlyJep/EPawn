import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';
import { initTheme } from '../services/theme';

initTheme();

const rootEl = document.getElementById('admin-root');
createRoot(rootEl).render(React.createElement(AdminApp));
