import React from 'react';

export default function AboutPage({ user, routes, onOpenModal }) {
    return (
        <section className="cta page-section">
            <div className="section-inner">
                <span className="section-label">About E-PAWN</span>
                <h2>Save Smart & Spend Wise</h2>
                <p>
                    E-PAWN is a personal finance monitoring platform designed to help you track savings,
                    loans, and income in one place. We focus on clarity and control — not lending or cash advances.
                </p>
                <p>
                    Whether you are managing household budgets, monitoring loan repayments, or logging monthly income,
                    E-PAWN gives you a simple dashboard to stay organized and make smarter financial decisions.
                </p>
                {user ? (
                    <a href={routes.dashboard} className="btn btn-primary btn-lg">Go to Dashboard</a>
                ) : (
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => onOpenModal('register')}>
                        Create Free Account
                    </button>
                )}
            </div>
        </section>
    );
}
