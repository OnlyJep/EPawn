import React from 'react';
import LegalPage from '../components/LegalPage';

export default function HelpCenterPage() {
    return (
        <LegalPage title="Help Center">
            <h2>Getting Started</h2>
            <p>Create a free account, then log your savings, loans, and income from your dashboard. E-PAWN is built for monitoring only — we do not provide loans or cash advances.</p>

            <h2>Account & Login</h2>
            <p>Use your username or email to sign in. If you forget your password, contact support and we will help you recover access to your account.</p>

            <h2>Tracking Savings</h2>
            <p>Add your savings records to see balances and progress over time. Update entries whenever you deposit or withdraw funds.</p>

            <h2>Tracking Loans</h2>
            <p>Record loan amounts, due dates, and payments so you always know what is outstanding and when the next payment is due.</p>

            <h2>Logging Income</h2>
            <p>Log salary, freelance work, and other income sources to understand how money flows in each month.</p>

            <h2>Contact Support</h2>
            <p>Email us at <strong>support@epawn.local</strong> for account help, technical issues, or general questions. Our team aims to respond within 24 hours.</p>
        </LegalPage>
    );
}
