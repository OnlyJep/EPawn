import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import PasswordField from './PasswordField';
import SuffixSelect from './SuffixSelect';
import { login, register, resetPasswordSurvey, sendVerificationCode, registerWithCode, resendCode } from '../services/epawnApi';

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#424242" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
    );
}

function formatApiErrors(error) {
    if (! error?.response?.data?.errors) {
        return [error?.response?.data?.message || 'Something went wrong. Please try again.'];
    }

    return Object.values(error.response.data.errors).flat();
}

const SURVEY_STEPS = [
    {
        title: 'Account',
        description: 'Enter the username or email linked to your account.',
    },
    {
        title: 'Identity Survey',
        description: 'Answer these questions to confirm it is really you.',
    },
    {
        title: 'New Password',
        description: 'Choose a new password for your account.',
    },
];

export default function AuthModals({
    activeModal,
    onClose,
    onSwitch,
    logo,
    routes,
    errors,
    old,
}) {
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [suffix, setSuffix] = useState(old?.suffix || '');
    const [loginErrors, setLoginErrors] = useState(errors?.login ? [errors.login[0]] : []);
    const [registerErrors, setRegisterErrors] = useState(
        errors && !errors.login ? Object.values(errors).flat() : []
    );
    const [submitting, setSubmitting] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [usernameValue, setUsernameValue] = useState(old?.username || '');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [registerStep, setRegisterStep] = useState(1);
    const [registerFormData, setRegisterFormData] = useState(null);

    // Password strength
    const getPasswordStrength = (pwd) => {
        if (!pwd) return null;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 1) return 'weak';
        if (score <= 2) return 'medium';
        return 'strong';
    };
    const passwordStrength = getPasswordStrength(password);
    const strengthColor = { weak: '#ef4444', medium: '#f59e0b', strong: '#22c55e' };
    const strengthWidth = { weak: '33%', medium: '66%', strong: '100%' };
    const strengthLabel = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };
    const [forgotStep, setForgotStep] = useState(0);
    const [forgotForm, setForgotForm] = useState({
        username_or_email: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [forgotPassword, setForgotPassword] = useState('');
    const [forgotPasswordConfirm, setForgotPasswordConfirm] = useState('');

    useEffect(() => {
        document.body.style.overflow = activeModal ? 'hidden' : '';

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [activeModal, onClose]);

    useEffect(() => {
        if (activeModal !== 'forgot') {
            setForgotStep(0);
            setForgotForm({
                username_or_email: '',
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                password_confirmation: '',
            });
            setForgotPassword('');
            setForgotPasswordConfirm('');
        }
        if (activeModal !== 'register') {
            setAgreedToTerms(false);
            setUsernameValue('');
            setVerificationEmail('');
            setVerificationCode('');
            setRegisterStep(1);
            setRegisterFormData(null);
        }
    }, [activeModal]);

    const handleLogin = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setLoginErrors([]);

        const formData = new FormData(event.target);

        try {
            const data = await login({
                username: formData.get('username'),
                password: formData.get('password'),
            });

            message.success('Signed in successfully.');
            window.location.href = data.redirect || routes.dashboard;
        } catch (error) {
            const errorMessage = formatApiErrors(error)[0];
            setLoginErrors([errorMessage]);
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();

        if (password !== passwordConfirm) {
            message.error('Password and confirm password do not match.');
            return;
        }

        setSubmitting(true);
        setRegisterErrors([]);

        const formData = new FormData(event.target);
        const email = formData.get('email');

        // Store form data for step 2
        setRegisterFormData({
            first_name: formData.get('first_name'),
            middle_initial: formData.get('middle_initial'),
            last_name: formData.get('last_name'),
            suffix: suffix || null,
            username: formData.get('username'),
            email: email,
            password: formData.get('password'),
        });

        try {
            await sendVerificationCode(email);
            setVerificationEmail(email);
            setRegisterStep(2);
            message.success('Verification code sent to your email');
        } catch (error) {
            const apiErrors = formatApiErrors(error);
            setRegisterErrors(apiErrors);
            message.error(apiErrors[0]);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendVerificationCode = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setRegisterErrors([]);

        const formData = new FormData(event.target);
        const email = formData.get('email');

        try {
            await sendVerificationCode(email);
            setVerificationEmail(email);
            setRegisterStep(2);
            message.success('Verification code sent to your email');
        } catch (error) {
            const apiErrors = formatApiErrors(error);
            setRegisterErrors(apiErrors);
            message.error(apiErrors[0]);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyAndRegister = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setRegisterErrors([]);

        try {
            const data = await registerWithCode({
                email: verificationEmail,
                code: verificationCode,
                username: registerFormData.username,
                password: registerFormData.password,
                first_name: registerFormData.first_name,
                last_name: registerFormData.last_name,
                middle_initial: registerFormData.middle_initial || null,
                suffix: registerFormData.suffix || null,
            });

            message.success('Registration successful!');
            window.location.href = routes.dashboard;
        } catch (error) {
            const apiErrors = formatApiErrors(error);
            setRegisterErrors(apiErrors);
            message.error(apiErrors[0]);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        setSubmitting(true);
        try {
            await resendCode(verificationEmail);
            message.success('Verification code resent to your email');
        } catch (error) {
            message.error('Failed to resend code. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleForgotNext = (event) => {
        event.preventDefault();

        if (forgotStep === 0 && ! forgotForm.username_or_email.trim()) {
            message.error('Please enter your username or email.');
            return;
        }

        if (forgotStep === 1) {
            if (! forgotForm.first_name.trim() || ! forgotForm.last_name.trim() || ! forgotForm.email.trim()) {
                message.error('Please complete all survey questions.');
                return;
            }
        }

        setForgotStep((step) => step + 1);
    };

    const handleForgotSubmit = async (event) => {
        event.preventDefault();

        if (forgotPassword !== forgotPasswordConfirm) {
            message.error('Password and confirm password do not match.');
            return;
        }

        setSubmitting(true);

        try {
            const data = await resetPasswordSurvey({
                username_or_email: forgotForm.username_or_email.trim(),
                first_name: forgotForm.first_name.trim(),
                last_name: forgotForm.last_name.trim(),
                email: forgotForm.email.trim(),
                password: forgotPassword,
                password_confirmation: forgotPasswordConfirm,
            });

            message.success(data.message || 'Password reset successfully.');
            onSwitch('login');
        } catch (error) {
            message.error(formatApiErrors(error)[0]);
        } finally {
            setSubmitting(false);
        }
    };

    const updateForgotField = (field) => (event) => {
        setForgotForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    return (
        <>
            <div
                className={`modal-overlay${activeModal === 'login' ? ' active' : ''}`}
                onClick={(event) => event.target === event.currentTarget && onClose()}
            >
                <div className="modal">
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                        <CloseIcon />
                    </button>
                    <div className="modal-logo">
                        <img src={logo} alt="E-PAWN" />
                    </div>
                    <h2>Welcome Back</h2>
                    <p className="modal-subtitle">Sign in to your E-PAWN account</p>

                    {loginErrors.length > 0 && (
                        <div className="form-error">{loginErrors[0]}</div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="login-username">Username or Email</label>
                            <input
                                type="text"
                                id="login-username"
                                name="username"
                                className="form-control"
                                defaultValue={old?.username || ''}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <PasswordField
                                id="login-password"
                                name="password"
                                placeholder="Enter your password"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Signing in...' : 'Sign In'}
                        </button>
                        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                            <a
                                href="/api/auth/google"
                                className="btn btn-google"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--google-btn-bg)',
                                    color: 'var(--google-btn-text)',
                                    border: '1px solid var(--google-btn-border)',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    width: '100%',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Sign in with Google
                            </a>
                        </div>
                    </form>
                    <p className="modal-switch modal-switch--stacked">
                        <button type="button" onClick={() => onSwitch('forgot')}>Forgot password?</button>
                    </p>
                    <p className="modal-switch">
                        Don&apos;t have an account?{' '}
                        <button type="button" onClick={() => onSwitch('register')}>Register here</button>
                    </p>
                </div>
            </div>

            <div
                className={`modal-overlay${activeModal === 'register' ? ' active' : ''}`}
                onClick={(event) => event.target === event.currentTarget && onClose()}
            >
                <div className="modal modal--wide">
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                        <CloseIcon />
                    </button>
                    <div className="modal-logo">
                        <img src={logo} alt="E-PAWN" />
                    </div>
                    {registerStep === 1 ? (
                        <>
                            <h2>Create Account</h2>
                            <p className="modal-subtitle">Join E-PAWN and start saving smart</p>

                            {registerErrors.length > 0 && (
                                <div className="form-error">
                                    {registerErrors.map((error) => (
                                        <span key={error}>{error}<br /></span>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleRegister}>
                                {/* Row 1: First Name + Last Name */}
                                <div className="form-row form-row--uniform">
                                    <div className="form-group">
                                        <label htmlFor="reg-first-name">First Name</label>
                                        <input
                                            type="text"
                                            id="reg-first-name"
                                            name="first_name"
                                            className="form-control"
                                            placeholder="Juan"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-last-name">Last Name</label>
                                        <input
                                            type="text"
                                            id="reg-last-name"
                                            name="last_name"
                                            className="form-control"
                                            placeholder="Dela Cruz"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Middle Initial + Suffix */}
                                <div className="form-row form-row--uniform">
                                    <div className="form-group">
                                        <label htmlFor="reg-middle-initial">Middle Initial <span style={{ fontWeight: 400, color: 'var(--gray-400)', fontSize: '0.8rem' }}>(Optional)</span></label>
                                        <input
                                            type="text"
                                            id="reg-middle-initial"
                                            name="middle_initial"
                                            className="form-control"
                                            placeholder="M"
                                            maxLength={1}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-suffix">Suffix</label>
                                        <SuffixSelect
                                            id="reg-suffix"
                                            name="suffix"
                                            value={suffix}
                                            onChange={(event) => setSuffix(event.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Username (full width) */}
                                <div className="form-group">
                                    <label htmlFor="reg-username">Username</label>
                                    <input
                                        type="text"
                                        id="reg-username"
                                        name="username"
                                        className="form-control"
                                        value={usernameValue}
                                        onChange={(e) => setUsernameValue(e.target.value)}
                                        placeholder="Type your username"
                                        required
                                    />
                                </div>

                                {/* Row 4: Email (full width) */}
                                <div className="form-group">
                                    <label htmlFor="reg-email">Email Address</label>
                                    <input
                                        type="email"
                                        id="reg-email"
                                        name="email"
                                        className="form-control"
                                        placeholder="you@email.com"
                                        required
                                    />
                                </div>

                                {/* Row 5: Password + Confirm Password */}
                                <div className="form-row form-row--uniform">
                                    <div className="form-group">
                                        <label htmlFor="reg-password">Password</label>
                                        <PasswordField
                                            id="reg-password"
                                            name="password"
                                            placeholder="Min. 6 chars"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                        />
                                        {/* Password strength bar */}
                                        {password && (
                                            <div style={{ marginTop: '0.4rem' }}>
                                                <div style={{ height: '4px', background: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: strengthWidth[passwordStrength], background: strengthColor[passwordStrength], transition: 'width 0.3s ease, background 0.3s ease', borderRadius: '4px' }} />
                                                </div>
                                                <p style={{ fontSize: '0.72rem', margin: '0.2rem 0 0', color: strengthColor[passwordStrength], fontWeight: 700 }}>
                                                    {strengthLabel[passwordStrength]} password
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-password-confirm">Confirm Password</label>
                                        <PasswordField
                                            id="reg-password-confirm"
                                            name="password_confirmation"
                                            placeholder="Repeat password"
                                            value={passwordConfirm}
                                            onChange={(event) => setPasswordConfirm(event.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Terms & Conditions checkbox */}
                                <div className="form-terms-check">
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            style={{ marginTop: '2px', accentColor: 'var(--red)', width: '15px', height: '15px', flexShrink: 0, cursor: 'pointer' }}
                                        />
                                        <span>
                                            I agree to the{' '}
                                            <a
                                                href={routes?.termsOfService || '/terms-of-service'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#1d6fb8', fontWeight: 700, textDecoration: 'underline' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Terms of Service
                                            </a>
                                        </span>
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={submitting || !agreedToTerms} style={{ marginTop: '0.75rem', opacity: (!agreedToTerms) ? 0.6 : 1 }}>
                                    {submitting ? 'Registering...' : 'Register'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2>Verify Your Email</h2>
                            <p className="modal-subtitle">Enter the code sent to {verificationEmail}</p>

                            {registerErrors.length > 0 && (
                                <div className="form-error">
                                    {registerErrors.map((error) => (
                                        <span key={error}>{error}<br /></span>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleVerifyAndRegister}>
                                <div className="form-group">
                                    <label htmlFor="verification-code">Verification Code</label>
                                    <input
                                        type="text"
                                        id="verification-code"
                                        className="form-control"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        required
                                        style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={submitting}
                                        style={{
                                            marginTop: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            background: 'none',
                                            border: 'none',
                                            color: '#1d6fb8',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {submitting ? 'Resending...' : 'Resend Code'}
                                    </button>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setRegisterStep(1)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Creating account...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                    <p className="modal-switch">
                        Already have an account?{' '}
                        <button type="button" onClick={() => onSwitch('login')}>Sign in here</button>
                    </p>
                </div>
            </div>

            <div
                className={`modal-overlay${activeModal === 'forgot' ? ' active' : ''}`}
                onClick={(event) => event.target === event.currentTarget && onClose()}
            >
                <div className="modal modal--wide">
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                        <CloseIcon />
                    </button>
                    <div className="modal-logo">
                        <img src={logo} alt="E-PAWN" />
                    </div>
                    <h2>Reset Password</h2>
                    <p className="modal-subtitle">{SURVEY_STEPS[forgotStep].description}</p>

                    <div className="forgot-steps">
                        {SURVEY_STEPS.map((step, index) => (
                            <span
                                key={step.title}
                                className={`forgot-steps__item${index === forgotStep ? ' active' : ''}${index < forgotStep ? ' done' : ''}`}
                            >
                                {index + 1}. {step.title}
                            </span>
                        ))}
                    </div>

                    {forgotStep === 0 && (
                        <form onSubmit={handleForgotNext}>
                            <div className="form-group">
                                <label htmlFor="forgot-account">Username or Email</label>
                                <input
                                    type="text"
                                    id="forgot-account"
                                    className="form-control"
                                    value={forgotForm.username_or_email}
                                    onChange={updateForgotField('username_or_email')}
                                    placeholder="Enter your username or email"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Continue Survey</button>
                        </form>
                    )}

                    {forgotStep === 1 && (
                        <form onSubmit={handleForgotNext}>
                            <div className="form-group">
                                <label htmlFor="forgot-first-name">What is your first name?</label>
                                <input
                                    type="text"
                                    id="forgot-first-name"
                                    className="form-control"
                                    value={forgotForm.first_name}
                                    onChange={updateForgotField('first_name')}
                                    placeholder="Enter your first name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="forgot-last-name">What is your last name?</label>
                                <input
                                    type="text"
                                    id="forgot-last-name"
                                    className="form-control"
                                    value={forgotForm.last_name}
                                    onChange={updateForgotField('last_name')}
                                    placeholder="Enter your last name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="forgot-email">What is your email address?</label>
                                <input
                                    type="email"
                                    id="forgot-email"
                                    className="form-control"
                                    value={forgotForm.email}
                                    onChange={updateForgotField('email')}
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setForgotStep(0)}>
                                    Back
                                </button>
                                <button type="submit" className="btn btn-primary">Continue</button>
                            </div>
                        </form>
                    )}

                    {forgotStep === 2 && (
                        <form onSubmit={handleForgotSubmit}>
                            <div className="form-group">
                                <label htmlFor="forgot-new-password">New Password</label>
                                <PasswordField
                                    id="forgot-new-password"
                                    name="password"
                                    placeholder="Min. 6 characters"
                                    value={forgotPassword}
                                    onChange={(event) => setForgotPassword(event.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="forgot-new-password-confirm">Confirm New Password</label>
                                <PasswordField
                                    id="forgot-new-password-confirm"
                                    name="password_confirmation"
                                    placeholder="Repeat new password"
                                    value={forgotPasswordConfirm}
                                    onChange={(event) => setForgotPasswordConfirm(event.target.value)}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setForgotStep(1)}>
                                    Back
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="modal-switch">
                        Remember your password?{' '}
                        <button type="button" onClick={() => onSwitch('login')}>Sign in here</button>
                    </p>
                </div>
            </div>
        </>
    );
}
