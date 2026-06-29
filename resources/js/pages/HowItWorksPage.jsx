import React from 'react';
import { steps } from '../constants/landingData';

export default function HowItWorksPage() {
    return (
        <section className="page-section">
            <div className="section-inner">
                <div className="section-header">
                    <span className="section-label">Simple Process</span>
                    <h2>How E-PAWN Works</h2>
                    <p>Three easy steps to start monitoring your finances with clarity.</p>
                </div>
                <div className="steps">
                    {steps.map((step, index) => (
                        <div className="step" key={step.title}>
                            <div className="step-number">{index + 1}</div>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
