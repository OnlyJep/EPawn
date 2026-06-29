import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import HelpCenterPage from './pages/HelpCenterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import { initTheme, getStoredTheme, applyTheme } from './services/theme';

const pages = {
    '/': HomePage,
    '/features': FeaturesPage,
    '/how-it-works': HowItWorksPage,
    '/about': AboutPage,
    '/help-center': HelpCenterPage,
    '/privacy-policy': PrivacyPolicyPage,
    '/terms-of-service': TermsOfServicePage,
};

export default function EpawnApp(props) {
    const path = window.location.pathname;
    const Page = pages[path] || HomePage;
    const [theme, setTheme] = useState(() => initTheme());

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        applyTheme(next);
    };

    return (
        <Layout {...props} theme={theme} onToggleTheme={toggleTheme}>
            <Page {...props} />
        </Layout>
    );
}
