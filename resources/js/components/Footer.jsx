import React from 'react';

export default function Footer({ routes, logo, year, onOpenModal }) {
    return (
        <footer>
            <div className="footer-inner">
                <div className="footer-brand">
                    <img src={logo} alt="E-PAWN" />
                    <p>E-PAWN — Your personal finance monitoring platform. Save smart, spend wise, and stay in control of your money.</p>
                </div>
                <div className="footer-col">
                    <h4>Platform</h4>
                    <ul>
                        <li><a href={routes.features}>Features</a></li>
                        <li><a href={routes.howItWorks}>How It Works</a></li>
                        <li>
                            <button type="button" className="footer-link-btn" onClick={() => onOpenModal('register')}>
                                Register
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Support</h4>
                    <ul>
                        <li><a href={routes.helpCenter}>Help Center</a></li>
                        <li><a href={routes.privacyPolicy}>Privacy Policy</a></li>
                        <li><a href={routes.termsOfService}>Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                &copy; {year} E-PAWN. All rights reserved. Save Smart • Spend Wise.
            </div>
        </footer>
    );
}
