import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Input, Select, message, InputNumber } from 'antd';
import { EditOutlined, InboxOutlined, UndoOutlined, SearchOutlined } from '@ant-design/icons';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [editCat, setEditCat] = useState(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState('expense');
    const [saving, setSaving] = useState(false);

    const fetchCats = () => {
        setLoading(true);
        const params = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
        fetch(`/admin/categories${params}`)
            .then((r) => r.json())
            .then((d) => { setCategories(d.categories || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchCats(); }, [statusFilter]);

    const handleArchive = async (ids) => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        for (const id of ids) {
            await fetch(`/admin/categories/${id}/archive`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf } });
        }
        message.success(`${ids.length} category(ies) updated`);
        setSelectedRowKeys([]);
        fetchCats();
    };

    const openEdit = (c) => { setEditCat(c); setEditName(c.name); setEditType(c.type); };
    const handleEdit = async () => {
        setSaving(true);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        try {
            const res = await fetch(`/admin/categories/${editCat.id}/edit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ name: editName, type: editType }),
            });
            if (res.ok) { message.success('Category updated'); setEditCat(null); fetchCats(); }
            else { const d = await res.json(); message.error(d.message || 'Failed'); }
        } catch { message.error('Connection error'); }
        finally { setSaving(false); }
    };

    const filtered = categories.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.username?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            title: (
                <Button type="text" size="small" onClick={() => handleArchive(selectedRowKeys)} disabled={selectedRowKeys.length === 0}>
                    Archive ({selectedRowKeys.length})
                </Button>
            ),
            key: 'actions', width: 80, fixed: 'left',
            render: (_, record) => (
                <Space size="small">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    {record.archived_at ? (
                        <Button type="text" size="small" icon={<UndoOutlined />} onClick={() => handleArchive([record.id])} />
                    ) : (
                        <Button type="text" size="small" icon={<InboxOutlined />} onClick={() => handleArchive([record.id])} />
                    )}
                </Space>
            ),
        },
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Name', dataIndex: 'name', key: 'name', render: (v, r) => `${r.icon || ''} ${v}` },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (v) => <Tag color={v === 'income' ? 'green' : 'red'}>{v}</Tag> },
        { title: 'User', dataIndex: 'username', key: 'user', render: (v, r) => `${v} (ID: ${r.user_id})` },
        {
            title: 'Status', dataIndex: 'archived_at', key: 'status', width: 90,
            render: (v) => v ? <Tag color="orange">Archived</Tag> : <Tag color="green">Active</Tag>,
        },
        { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (v) => new Date(v).toLocaleDateString() },
    ];

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <h2 className="admin-page__title" style={{ margin: 0 }}>Categories</h2>
                <Space wrap>
                    <Input prefix={<SearchOutlined />} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
                    <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="archived">Archived</Select.Option>
                        <Select.Option value="all">All</Select.Option>
                    </Select>
                </Space>
            </div>
            <Table
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                size="small"
                loading={loading}
                scroll={{ x: 800 }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                    columnTitle: selectedRowKeys.length > 0 ? `${selectedRowKeys.length}` : '',
                }}
            />
            <Modal title="Edit Category" open={!!editCat} onCancel={() => setEditCat(null)} onOk={handleEdit} confirmLoading={saving} okText="Save">
                <div className="admin-login__field">
                    <label>Name</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="admin-login__field">
                    <label>Type</label>
                    <Select value={editType} onChange={setEditType} style={{ width: '100%' }}>
                        <Select.Option value="expense">Expense</Select.Option>
                        <Select.Option value="income">Income</Select.Option>
                    </Select>
                </div>
            </Modal>
        </div>
    );
}
