import React from 'react';
import { features } from '../constants/landingData';

const icons = [
    <svg key="savings" className="feature-icon" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" fill="#FFEBEE" />
        <rect x="22" y="28" width="36" height="28" rx="4" fill="#C62828" />
        <rect x="28" y="34" width="24" height="4" rx="2" fill="#FFF" opacity="0.8" />
        <path d="M30 62 L40 52 L50 58 L58 48" stroke="#C62828" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>,
    <svg key="loans" className="feature-icon" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" fill="#FFEBEE" />
        <path d="M40 18 L52 30 L40 42 L28 30 Z" fill="#C62828" />
        <rect x="34" y="42" width="12" height="20" rx="2" fill="#C62828" />
        <circle cx="40" cy="40" r="22" stroke="#C62828" strokeWidth="2" fill="none" strokeDasharray="4 3" />
    </svg>,
    <svg key="income" className="feature-icon" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" fill="#FFEBEE" />
        <rect x="24" y="22" width="32" height="44" rx="6" fill="#C62828" />
        <rect x="32" y="50" width="8" height="10" rx="2" fill="#FFF" opacity="0.6" />
        <rect x="44" y="46" width="8" height="14" rx="2" fill="#FFF" opacity="0.8" />
    </svg>,
];

export default function FeaturesPage() {
    return (
        <section className="features page-section">
            <div className="section-inner">
                <div className="section-header">
                    <span className="section-label">Why E-PAWN</span>
                    <h2>Smart Features for Smart Savers</h2>
                    <p>Everything you need to monitor your savings, loans, and income — all in one secure platform.</p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div className="feature-card" key={feature.title}>
                            {icons[index]}
                            <h3>{feature.title}</h3>
                            <p>{feature.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
