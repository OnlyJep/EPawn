import React, { useEffect, useState, useRef } from 'react';
import { message, Modal } from 'antd';
import PasswordField from '../../components/PasswordField';
import SuffixSelect from '../../components/SuffixSelect';
import { deleteAccount, updatePassword, updateProfile, updateProfileWithAvatar } from '../../services/epawnApi';
import { setEpawn } from '../../services/epawnStorage';
import { buildProfileUpdateMessage, getChangedProfileFields } from '../../utils/profileChanges';

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
    );
}

function buildProfileState(user, old) {
    return {
        first_name: old?.first_name ?? user?.profile?.first_name ?? '',
        middle_initial: old?.middle_initial ?? user?.profile?.middle_initial ?? '',
        last_name: old?.last_name ?? user?.profile?.last_name ?? '',
        suffix: old?.suffix ?? user?.profile?.suffix ?? '',
        username: old?.username ?? user?.username ?? '',
        email: old?.email ?? user?.email ?? '',
    };
}

function formatApiErrors(error) {
    if (! error?.response?.data?.errors) {
        return [error?.response?.data?.message || 'Something went wrong. Please try again.'];
    }

    return Object.values(error.response.data.errors).flat();
}

export default function SettingsModal({ open, onClose, user, defaultAvatar, errors, old, onUserUpdated }) {
    const [tab, setTab] = useState('profile');
    const [editing, setEditing] = useState(false);
    const [profile, setProfile] = useState(() => buildProfileState(user, old));
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteReasonChoice, setDeleteReasonChoice] = useState('');
    const [deleteReasonOther, setDeleteReasonOther] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [cropping, setCropping] = useState(false);

    const deleteReasons = [
        'I have a duplicate account',
        'I am concerned about my privacy',
        'I am not using the app anymore',
        'The app is too difficult to use',
        'I found a better alternative',
        'Other',
    ];

    const autoCropImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const size = Math.min(img.naturalWidth, img.naturalHeight);
                const x = (img.naturalWidth - size) / 2;
                const y = (img.naturalHeight - size) / 2;
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                ctx.beginPath();
                ctx.arc(200, 200, 200, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);
                canvas.toBlob((blob) => {
                    const cropped = new File([blob], file.name, { type: 'image/jpeg' });
                    resolve(cropped);
                }, 'image/jpeg', 0.92);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    useEffect(() => {
        if (open) {
            setProfile(buildProfileState(user, old));
            setEditing(false);
            setPassword('');
            setPasswordConfirm('');
            setAvatar(null);
            setAvatarPreview(null);
        }
    }, [open, user, old]);

    if (!open) {
        return null;
    }

    const handleProfileFieldChange = (field) => (event) => {
        setProfile((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setCropping(true);
        const cropped = await autoCropImage(file);
        setAvatar(cropped);
        setAvatarPreview(URL.createObjectURL(cropped));
        setCropping(false);
    };

    const handleProfileAction = async (event) => {
        event.preventDefault();

        if (! editing) {
            setEditing(true);
            return;
        }

        const changedFields = getChangedProfileFields(user, profile);

        if (changedFields.length === 0 && !avatar) {
            setEditing(false);
            return;
        }

        setSubmitting(true);

        try {
            let data;

            if (avatar) {
                const formData = new FormData();
                formData.append('first_name', profile.first_name);
                formData.append('middle_initial', profile.middle_initial || '');
                formData.append('last_name', profile.last_name);
                formData.append('suffix', profile.suffix || '');
                formData.append('username', profile.username);
                formData.append('email', profile.email);
                formData.append('avatar', avatar);
                data = await updateProfileWithAvatar(formData);
            } else {
                data = await updateProfile({
                    first_name: profile.first_name,
                    middle_initial: profile.middle_initial || null,
                    last_name: profile.last_name,
                    suffix: profile.suffix || null,
                    username: profile.username,
                    email: profile.email,
                });
            }

            setEpawn({ user: data.user });
            setProfile(buildProfileState(data.user));
            setEditing(false);
            setAvatar(null);
            setAvatarPreview(null);
            if (avatar) {
                message.success('Profile Image updated successfully.');
            } else {
                message.success(buildProfileUpdateMessage(changedFields));
            }
            onUserUpdated?.(data.user);
        } catch (error) {
            message.error(formatApiErrors(error)[0]);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        if (password !== passwordConfirm) {
            message.error('Password and confirm password do not match.');
            return;
        }

        setSubmitting(true);

        const formData = new FormData(event.target);

        try {
            await updatePassword({
                current_password: formData.get('current_password'),
                password: formData.get('password'),
                password_confirmation: formData.get('password_confirmation'),
            });

            setPassword('');
            setPasswordConfirm('');
            event.target.reset();
            message.success('Password updated successfully.');
        } catch (error) {
            message.error(formatApiErrors(error)[0]);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTabChange = (nextTab) => {
        setTab(nextTab);
        setEditing(false);
        setProfile(buildProfileState(user, old));
        setDeleteConfirmOpen(false);
        setAvatar(null);
        setAvatarPreview(null);
    };

    const currentAvatar = avatarPreview
        || (user?.profile?.avatar ? `/storage/${user.profile.avatar}` : null)
        || defaultAvatar
        || '/img/defpfp.webp';

    return (
        <div className="modal-overlay active settings-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
            <div className="modal modal--wide settings-modal">
                <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </button>
                <h2>Settings</h2>
                <p className="modal-subtitle">Update your profile and password</p>

                <div className="settings-tabs">
                    <button
                        type="button"
                        className={tab === 'profile' ? 'active' : ''}
                        onClick={() => handleTabChange('profile')}
                    >
                        Profile
                    </button>
                    <button
                        type="button"
                        className={tab === 'password' ? 'active' : ''}
                        onClick={() => handleTabChange('password')}
                    >
                        Password
                    </button>
                    <button
                        type="button"
                        className={tab === 'delete' ? 'active' : ''}
                        onClick={() => handleTabChange('delete')}
                        style={{ color: '#ef4444' }}
                    >
                        Delete Account
                    </button>
                </div>

                {tab === 'profile' && (
                    <form onSubmit={handleProfileAction}>
                        <div className="settings-avatar-section">
                            <div className="settings-avatar-wrapper">
                                <img
                                    src={currentAvatar}
                                    alt="Profile"
                                    className="settings-avatar"
                                />
                                {editing && (
                                    <label className="settings-avatar-edit-icon">
                                        {cropping ? (
                                            <span style={{ fontSize: '10px', fontWeight: 700 }}>...</span>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                                                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                                                <path d="M2 2l7.586 7.586"></path>
                                                <circle cx="11" cy="11" r="2"></circle>
                                            </svg>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                            onChange={handleAvatarChange}
                                            hidden
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="form-row form-row--uniform">
                            <div className="form-group">
                                <label htmlFor="set-first-name">First Name</label>
                                <input
                                    type="text"
                                    id="set-first-name"
                                    name="first_name"
                                    className="form-control"
                                    value={profile.first_name}
                                    onChange={handleProfileFieldChange('first_name')}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="set-middle-initial">M.I.</label>
                                <input
                                    type="text"
                                    id="set-middle-initial"
                                    name="middle_initial"
                                    className="form-control"
                                    value={profile.middle_initial}
                                    onChange={handleProfileFieldChange('middle_initial')}
                                    disabled={!editing}
                                    maxLength={1}
                                />
                            </div>
                        </div>
                        <div className="form-row form-row--uniform">
                            <div className="form-group">
                                <label htmlFor="set-last-name">Last Name</label>
                                <input
                                    type="text"
                                    id="set-last-name"
                                    name="last_name"
                                    className="form-control"
                                    value={profile.last_name}
                                    onChange={handleProfileFieldChange('last_name')}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="set-suffix">Suffix</label>
                                <SuffixSelect
                                    id="set-suffix"
                                    name="suffix"
                                    value={profile.suffix}
                                    onChange={handleProfileFieldChange('suffix')}
                                    disabled={!editing}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="set-username">Username</label>
                            <input
                                type="text"
                                id="set-username"
                                name="username"
                                className="form-control"
                                value={profile.username}
                                onChange={handleProfileFieldChange('username')}
                                disabled={!editing}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="set-email">Email</label>
                            <input
                                type="email"
                                id="set-email"
                                name="email"
                                className="form-control"
                                value={profile.email}
                                onChange={handleProfileFieldChange('email')}
                                disabled={!editing}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting
                                ? 'Saving...'
                                : editing
                                    ? 'Save Profile'
                                    : 'Edit Profile'}
                        </button>
                    </form>
                )}

                {tab === 'password' && (
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label htmlFor="set-current-password">Current Password</label>
                            <PasswordField
                                id="set-current-password"
                                name="current_password"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="set-new-password">New Password</label>
                            <PasswordField
                                id="set-new-password"
                                name="password"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="set-new-password-confirm">Confirm New Password</label>
                            <PasswordField
                                id="set-new-password-confirm"
                                name="password_confirmation"
                                placeholder="Repeat new password"
                                value={passwordConfirm}
                                onChange={(event) => setPasswordConfirm(event.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

                {tab === 'delete' && (
                    <div>
                        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <h3 style={{ color: '#dc2626', margin: '0 0 0.5rem', fontSize: '1rem' }}>Danger Zone</h3>
                            <p style={{ color: '#991b1b', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                                Deleting your account will permanently remove all your data including sheets, records, budgets, and account information. This action cannot be undone.
                            </p>
                        </div>

                        {!deleteConfirmOpen ? (
                            <button
                                type="button"
                                className="btn"
                                style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none' }}
                                onClick={() => setDeleteConfirmOpen(true)}
                            >
                                Delete My Account
                            </button>
                        ) : (
                            <form onSubmit={async (event) => {
                                event.preventDefault();
                                setSubmitting(true);
                                try {
                                    const reason = deleteReasonChoice === 'Other' ? deleteReasonOther : deleteReasonChoice;
                                    const data = await deleteAccount({ reason });
                                    message.success(data.message);
                                    window.location.href = data.redirect || '/';
                                } catch (error) {
                                    const err = error?.response?.data?.message || 'Failed to delete account.';
                                    message.error(err);
                                } finally {
                                    setSubmitting(false);
                                }
                            }}>
                                <p style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    Please select a reason for leaving:
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {deleteReasons.map((reason) => (
                                        <div
                                            key={reason}
                                            onClick={() => setDeleteReasonChoice(reason)}
                                            style={{
                                                padding: '0.65rem 1rem',
                                                borderRadius: '8px',
                                                border: `2px solid ${deleteReasonChoice === reason ? '#dc2626' : '#e5e7eb'}`,
                                                backgroundColor: deleteReasonChoice === reason ? '#fef2f2' : '#fff',
                                                cursor: 'pointer',
                                                fontWeight: deleteReasonChoice === reason ? 600 : 400,
                                                color: deleteReasonChoice === reason ? '#dc2626' : '#374151',
                                                transition: 'all 0.15s ease',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {reason}
                                        </div>
                                    ))}
                                </div>
                                {deleteReasonChoice === 'Other' && (
                                    <textarea
                                        className="form-control"
                                        placeholder="Please tell us why..."
                                        value={deleteReasonOther}
                                        onChange={(event) => setDeleteReasonOther(event.target.value)}
                                        rows={2}
                                        style={{ resize: 'vertical', marginBottom: '1rem' }}
                                    />
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn" disabled={submitting || !deleteReasonChoice} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none' }}>
                                        {submitting ? 'Deleting...' : 'Permanently Delete My Account'}
                                    </button>
                                    <button type="button" className="btn" onClick={() => { setDeleteConfirmOpen(false); setDeleteReasonChoice(''); setDeleteReasonOther(''); }} style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
