import React from 'react';

export default function LegalPage({ title, children }) {
    return (
        <section className="legal-page page-section">
            <div className="section-inner legal-page__inner">
                <div className="section-header">
                    <span className="section-label">E-PAWN</span>
                    <h1>{title}</h1>
                </div>
                <div className="legal-page__content">
                    {children}
                </div>
            </div>
        </section>
    );
}
