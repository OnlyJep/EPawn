import React from 'react';

export default function LoadingFallback() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#FAFAFA',
            fontFamily: 'Montserrat, sans-serif',
        }}>
            <div style={{
                width: 40,
                height: 40,
                border: '3px solid #E0E0E0',
                borderTopColor: '#C62828',
                borderRadius: '50%',
                animation: 'dashboard-spin 0.8s linear infinite',
                marginBottom: '1rem',
            }} />
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading dashboard...</p>
            <style>{`
                @keyframes dashboard-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
