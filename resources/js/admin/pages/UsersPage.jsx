import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Input, message, Select } from 'antd';
import {
    EyeOutlined, EditOutlined, InboxOutlined, UndoOutlined,
    SearchOutlined
} from '@ant-design/icons';

export default function UsersPage({ onViewUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchUsers = () => {
        setLoading(true);
        const params = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
        fetch(`/admin/users${params}`)
            .then((r) => r.json())
            .then((d) => { setUsers(d.users || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, [statusFilter]);

    const handleArchive = async (ids) => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        for (const id of ids) {
            await fetch(`/admin/users/${id}/archive`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf } });
        }
        message.success(`${ids.length} user(s) updated`);
        setSelectedRowKeys([]);
        fetchUsers();
    };

    const openEdit = (u) => { setEditUser(u); setEditUsername(u.username); setEditEmail(u.email); };
    const handleEdit = async () => {
        setSaving(true);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        try {
            const res = await fetch(`/admin/users/${editUser.id}/edit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ username: editUsername, email: editEmail }),
            });
            if (res.ok) { message.success('User updated'); setEditUser(null); fetchUsers(); }
            else { const d = await res.json(); message.error(d.message || 'Failed'); }
        } catch { message.error('Connection error'); }
        finally { setSaving(false); }
    };

    const filtered = users.filter((u) =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            title: (
                <Button type="text" size="small" onClick={() => handleArchive(selectedRowKeys)} disabled={selectedRowKeys.length === 0}>
                    Archive ({selectedRowKeys.length})
                </Button>
            ),
            key: 'actions',
            width: 80,
            fixed: 'left',
            render: (_, record) => (
                <Space size="small">
                    <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onViewUser(record.id)} />
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    {record.archived_at ? (
                        <Button type="text" size="small" icon={<UndoOutlined />} onClick={() => handleArchive([record.id])} />
                    ) : (
                        <Button type="text" size="small" icon={<InboxOutlined />} onClick={() => handleArchive([record.id])} />
                    )}
                </Space>
            ),
        },
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60, sorter: (a, b) => a.id - b.id },
        { title: 'Username', dataIndex: 'username', key: 'username', sorter: (a, b) => a.username?.localeCompare(b.username) },
        { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
        {
            title: 'Google', dataIndex: 'google_id', key: 'google_id', width: 70,
            render: (v) => v ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>,
        },
        {
            title: 'Status', dataIndex: 'archived_at', key: 'status', width: 90,
            render: (v) => v ? <Tag color="orange">Archived</Tag> : <Tag color="green">Active</Tag>,
        },
        { title: 'Cats', dataIndex: 'categories_count', key: 'cats', width: 60, sorter: (a, b) => a.categories_count - b.categories_count },
        { title: 'Accts', dataIndex: 'accounts_count', key: 'accts', width: 60 },
        { title: 'Txns', dataIndex: 'transactions_count', key: 'txns', width: 60 },
        { title: 'Budgets', dataIndex: 'budgets_count', key: 'budgets', width: 70 },
        {
            title: 'Joined', dataIndex: 'created_at', key: 'created_at', width: 100,
            render: (v) => new Date(v).toLocaleDateString(),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
    ];

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <h2 className="admin-page__title" style={{ margin: 0 }}>Users</h2>
                <Space wrap>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 220 }}
                        allowClear
                    />
                    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="archived">Archived</Select.Option>
                        <Select.Option value="all">All Users</Select.Option>
                    </Select>
                </Space>
            </div>
            <Table
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                size="small"
                loading={loading}
                scroll={{ x: 900 }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    columnTitle: (
                        <span style={{ fontWeight: 600, fontSize: 12 }}>
                            {selectedRowKeys.length > 0 ? `${selectedRowKeys.length}` : ''}
                        </span>
                    ),
                }}
            />
            <Modal
                title="Edit User"
                open={!!editUser}
                onCancel={() => setEditUser(null)}
                onOk={handleEdit}
                confirmLoading={saving}
                okText="Save"
            >
                <div className="admin-login__field">
                    <label>Username</label>
                    <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                </div>
                <div className="admin-login__field">
                    <label>Email</label>
                    <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
            </Modal>
        </div>
    );
}
