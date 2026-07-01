import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'Montserrat, sans-serif',
                    background: '#FAFAFA'
                }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#333' }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                        Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 2rem',
                            border: 'none',
                            borderRadius: '50px',
                            background: '#dc2626',
                            color: '#fff',
                            fontSize: '1rem',
                            cursor: 'pointer',
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
