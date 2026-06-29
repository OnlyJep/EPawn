import React from 'react';
import { HeroIllustration } from '../components/HeroIllustration';

const features = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 6v6l4 2"/>
            </svg>
        ),
        title: 'Real-Time Tracking',
        text: 'Monitor your savings, expenses, and income in real time. Every transaction is logged instantly so you never miss a beat.',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
            </svg>
        ),
        title: 'Smart Dashboard',
        text: 'Get a bird\'s-eye view of your financial health. Clear charts and summaries make it easy to understand your money.',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
        ),
        title: 'Budget Planning',
        text: 'Create personalized budget plans for trips, events, or goals. Set limits and track every peso you allocate.',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        ),
        title: 'Multi-Account Support',
        text: 'Manage multiple wallets, bank accounts, and cash funds from one unified place. Perfect for every Filipino\'s lifestyle.',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
        ),
        title: 'Income & Expense Logs',
        text: 'Categorize every transaction with ease. Know exactly where your money comes from and where it goes.',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <path d="M9 7h6M9 11h6M9 15h4"/>
            </svg>
        ),
        title: 'Detailed Records',
        text: 'Keep clean, searchable records of all your financial activity. Filter by date, category, or account anytime.',
    },
];

const steps = [
    {
        step: '01',
        title: 'Create Your Free Account',
        text: 'Sign up in seconds. No credit card required. Just your email and a password to get started.',
    },
    {
        step: '02',
        title: 'Set Up Your Accounts',
        text: 'Add your wallets, banks, or cash on hand. E-PAWN organizes everything in one clean dashboard.',
    },
    {
        step: '03',
        title: 'Log Your Transactions',
        text: 'Record income, expenses, and transfers. Add categories and notes for full clarity.',
    },
    {
        step: '04',
        title: 'Track & Stay in Control',
        text: 'View your financial picture anytime. Use budget plans to reach goals faster.',
    },
];

const benefits = [
    {
        emoji: '🇵🇭',
        title: 'Built for Filipinos',
        text: 'Designed with the everyday Filipino in mind — from sari-sari savings to salaries and OFW remittances.',
    },
    {
        emoji: '🔒',
        title: 'Safe & Private',
        text: 'Your financial data is yours. We never share, sell, or expose your personal information.',
    },
    {
        emoji: '📱',
        title: 'Works Everywhere',
        text: 'Access E-PAWN on any device — desktop, tablet, or mobile. Your finances follow you.',
    },
    {
        emoji: '⚡',
        title: 'Fast & Lightweight',
        text: 'No heavy apps or downloads needed. Just open your browser and start tracking instantly.',
    },
];

export default function HomePage({ user, routes, onOpenModal }) {
    const dashboardUrl = routes.dashboard;

    return (
        <>
            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Smart Finance Monitoring Platform
                        </div>
                        <p className="hero-tagline">SAVE SMART • SPEND WISE</p>
                        <h1>Your Smart Way to <span>Track & Save</span></h1>
                        <p>E-PAWN helps you monitor your savings, expenses, and income in one place. Stay on top of your finances with clear records and easy-to-read dashboards.</p>
                        <div className="hero-actions">
                            {user ? (
                                <a href={dashboardUrl} className="btn btn-primary">Go to Dashboard</a>
                            ) : (
                                <>
                                    <button type="button" className="btn btn-primary" onClick={() => onOpenModal('register')}>Get Started Free</button>
                                    <button type="button" className="btn btn-outline" onClick={() => onOpenModal('login')}>Sign In</button>
                                </>
                            )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '1rem', marginBottom: 0 }}>
                            ✓ Free to use &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Start in 60 seconds
                        </p>
                    </div>
                    <div className="hero-visual">
                        <HeroIllustration />
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="hp-features" id="features">
                <div className="section-inner">
                    <div className="section-header">
                        <span className="section-label">Features</span>
                        <h2>Everything You Need to Master Your Money</h2>
                        <p>Powerful tools that are simple enough for anyone to use — no accounting degree required.</p>
                    </div>
                    <div className="hp-features-grid">
                        {features.map((f) => (
                            <div key={f.title} className="hp-feature-card">
                                <div className="hp-feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="hp-how" id="how-it-works">
                <div className="section-inner">
                    <div className="section-header">
                        <span className="section-label">How It Works</span>
                        <h2>Up and Running in Minutes</h2>
                        <p>Getting started with E-PAWN is fast, simple, and completely free.</p>
                    </div>
                    <div className="hp-steps">
                        {steps.map((s, i) => (
                            <div key={s.step} className="hp-step">
                                <div className="hp-step-number">{s.step}</div>
                                <div className="hp-step-content">
                                    <h3>{s.title}</h3>
                                    <p>{s.text}</p>
                                </div>
                                {i < steps.length - 1 && <div className="hp-step-connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BENEFITS ── */}
            <section className="hp-benefits">
                <div className="section-inner">
                    <div className="section-header">
                        <span className="section-label">Why E-PAWN</span>
                        <h2>Designed Around Your Real Life</h2>
                        <p>We built E-PAWN to solve the real financial challenges everyday Filipinos face.</p>
                    </div>
                    <div className="hp-benefits-grid">
                        {benefits.map((b) => (
                            <div key={b.title} className="hp-benefit-card">
                                <div className="hp-benefit-emoji">{b.emoji}</div>
                                <h3>{b.title}</h3>
                                <p>{b.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PREVIEW STRIP ── */}
            <section className="hp-preview">
                <div className="section-inner">
                    <div className="hp-preview-inner">
                        <div className="hp-preview-content">
                            <span className="section-label">Dashboard Preview</span>
                            <h2>See Your Finances at a Glance</h2>
                            <p>The E-PAWN dashboard gives you instant clarity — accounts, records, budget plans, and category breakdowns all in one screen.</p>
                            <ul className="hp-preview-list">
                                <li>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                    Overview of all accounts & balances
                                </li>
                                <li>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                    Income vs. expense breakdown
                                </li>
                                <li>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                    Budget planning with progress tracking
                                </li>
                                <li>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                    Searchable & filterable transaction records
                                </li>
                            </ul>
                            {user ? (
                                <a href={dashboardUrl} className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>Open My Dashboard</a>
                            ) : (
                                <button type="button" className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => onOpenModal('register')}>
                                    Try It Free
                                </button>
                            )}
                        </div>
                        <div className="hp-preview-visual">
                            <div className="hp-dashboard-mockup">
                                <div className="hp-mockup-bar">
                                    <span /><span /><span />
                                </div>
                                <div className="hp-mockup-body">
                                    <div className="hp-mockup-sidebar">
                                        {['Overview', 'Accounts', 'Records', 'Budget', 'Categories'].map((item) => (
                                            <div key={item} className="hp-mockup-nav-item">{item}</div>
                                        ))}
                                    </div>
                                    <div className="hp-mockup-content">
                                        <div className="hp-mockup-cards">
                                            {[
                                                { label: 'Total Balance', val: '₱24,500', color: '#C62828' },
                                                { label: 'Income', val: '+₱8,200', color: '#10b981' },
                                                { label: 'Expenses', val: '-₱3,700', color: '#C62828' },
                                            ].map((c) => (
                                                <div key={c.label} className="hp-mockup-card">
                                                    <div style={{ fontSize: '0.55rem', color: '#9E9E9E', marginBottom: '4px' }}>{c.label}</div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: c.color }}>{c.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="hp-mockup-chart">
                                            {[60, 80, 45, 90, 65, 75, 50].map((h, i) => (
                                                <div key={i} className="hp-mockup-bar-item" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                        <div className="hp-mockup-rows">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="hp-mockup-row">
                                                    <div className="hp-mockup-row-dot" />
                                                    <div className="hp-mockup-row-line" style={{ width: `${60 + i * 10}%` }} />
                                                    <div className="hp-mockup-row-amount" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta">
                <div className="section-inner">
                    <div className="cta-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <h2>Take Control of Your Finances Today</h2>
                    <p>Join thousands of Filipinos who use E-PAWN to track savings, plan budgets, and finally understand where their money goes.</p>
                    {user ? (
                        <a href={routes.dashboard} className="btn btn-primary btn-lg">Go to Dashboard</a>
                    ) : (
                        <button type="button" className="btn btn-primary btn-lg" onClick={() => onOpenModal('register')}>
                            Create Free Account
                        </button>
                    )}
                </div>
            </section>
        </>
    );
}
