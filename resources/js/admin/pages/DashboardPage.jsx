import React, { useState, useEffect, useCallback } from 'react';
import { Select } from 'antd';
import {
    TeamOutlined, UserOutlined, AppstoreOutlined, BankOutlined,
    WalletOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UndoOutlined
} from '@ant-design/icons';
import UserDetailModal from '../components/UserDetailModal';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [detailUserId, setDetailUserId] = useState(null);
    const perPage = 10;

    useEffect(() => {
        fetch('/admin/dashboard')
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const res = await fetch(`/admin/users?${params}`);
            const d = await res.json();
            setUsers(d.users || []);
        } catch { setUsers([]); }
    }, [statusFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users.filter((u) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    const totalPages = Math.ceil(filtered.length / perPage);
    const paged = filtered.slice((page - 1) * perPage, page * perPage);

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) { setSelected(new Set()); setSelectAll(false); }
        else { setSelected(new Set(paged.map((u) => u.id))); setSelectAll(true); }
    };

    const handleArchive = async (id) => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        await fetch(`/admin/users/${id}/archive`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf } });
        fetchUsers();
    };

    const handleBulkArchive = async () => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        for (const id of selected) {
            await fetch(`/admin/users/${id}/archive`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf } });
        }
        setSelected(new Set());
        setSelectAll(false);
        fetchUsers();
    };

    if (loading) return <div className="admin-loading-inline"><div className="admin-loading__spinner" /></div>;
    if (!data) return null;

    const statCards = [
        { label: 'Total Users', value: data.total_users, icon: <TeamOutlined /> },
        { label: 'Active Users', value: data.active_users, icon: <UserOutlined /> },
        { label: 'Archived Users', value: data.archived_users, icon: <UserOutlined /> },
        { label: 'Total Categories', value: data.total_categories, icon: <AppstoreOutlined /> },
        { label: 'Active Categories', value: data.active_categories, icon: <AppstoreOutlined /> },
        { label: 'Archived Categories', value: data.archived_categories, icon: <AppstoreOutlined /> },
        { label: 'Total Accounts', value: data.total_accounts, icon: <BankOutlined /> },
        { label: 'Budget Plans', value: data.total_budget_plans, icon: <WalletOutlined /> },
    ];

    const colSpan = 9;

    return (
        <div className="workerlist-dashboard">
            <div className="workerlist-content">
                <h2>Admin Dashboard</h2>

                <div className="stats-grid">
                    {statCards.map((s) => (
                        <div className="stat-card" key={s.label}>
                            <div className="stat-card__icon">{s.icon}</div>
                            <div className="stat-card__value">{s.value}</div>
                            <div className="stat-card__label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="workerlist-header">
                    <div className="left-actions">
                        <span className="search-icon"><SearchOutlined /></span>
                        <input className="search-input" type="text" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <div className="right-actions">
                        {selected.size > 0 && (
                            <button className="header-button archive-all-button" onClick={handleBulkArchive}>
                                Archive ({selected.size})
                            </button>
                        )}
                        <Select
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); setPage(1); }}
                            style={{ width: 130 }}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'active', label: 'Active' },
                                { value: 'archived', label: 'Archived' },
                            ]}
                        />
                    </div>
                </div>

                <div className="workerlist-table">
                    <table>
                        <thead>
                            <tr>
                                <th className="col-check">
                                    <input type="checkbox" checked={selectAll && paged.length > 0} onChange={toggleSelectAll} />
                                </th>
                                <th className="col-actions">Actions</th>
                                <th className="col-id">ID</th>
                                <th className="col-username">Username</th>
                                <th className="col-email">Email</th>
                                <th className="col-status">Status</th>
                                <th className="col-count">Categories</th>
                                <th className="col-count">Accounts</th>
                                <th className="col-count">Budgets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr><td colSpan={colSpan} className="empty-row">No users found</td></tr>
                            ) : paged.map((u) => (
                                <tr key={u.id}>
                                    <td><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                                    <td>
                                        <div className="action-icons">
                                            <span className="edit-icon" title="Manage" onClick={() => setDetailUserId(u.id)}><EditOutlined /></span>
                                            <span className={u.archived_at ? 'restore-icon' : 'delete-icon'} title={u.archived_at ? 'Restore' : 'Archive'} onClick={() => handleArchive(u.id)}>
                                                {u.archived_at ? <UndoOutlined /> : <DeleteOutlined />}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{u.id}</td>
                                    <td><strong>{u.username}</strong></td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className={`status-badge ${u.archived_at ? 'archived' : 'active'}`}>
                                            {u.archived_at ? 'Archived' : 'Active'}
                                        </span>
                                    </td>
                                    <td>{u.categories_count ?? 0}</td>
                                    <td>{u.accounts_count ?? 0}</td>
                                    <td>{u.budgets_count ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="workerlist-pagination">
                        <span>Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>&lt;</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                        ))}
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>&gt;</button>
                    </div>
                )}
            </div>
            <UserDetailModal userId={detailUserId} visible={!!detailUserId} onClose={() => setDetailUserId(null)} />
        </div>
    );
}
