import React, { useState } from 'react';

export default function LoginPage({ onLogin, theme, onToggleTheme }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) onLogin();
            else { const d = await res.json(); setError(d.message || 'Invalid credentials'); }
        } catch { setError('Connection error'); }
        finally { setLoading(false); }
    };

    return (
        <div className="admin-login">
            <button type="button" className="admin-login__theme-btn" onClick={onToggleTheme} title="Toggle theme">
                {theme === 'dark' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                )}
            </button>
            <div className="admin-login__card">
                <div className="admin-login__logo">
                    <img src="/img/EPAWNlogo.png" alt="Epawn" style={{ height: 56 }} />
                </div>
                <h1 className="admin-login__title">Admin Portal</h1>
                <p className="admin-login__subtitle">Epawn Administration</p>
                <form onSubmit={handleSubmit}>
                    {error && <div className="admin-login__error">{error}</div>}
                    <div className="admin-login__field">
                        <label htmlFor="username">Username</label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required autoFocus />
                    </div>
                    <div className="admin-login__field">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
                    </div>
                    <button type="submit" className="admin-login__btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
