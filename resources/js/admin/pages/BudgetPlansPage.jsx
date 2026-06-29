import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Input, InputNumber, message, Select } from 'antd';
import { EditOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';

export default function BudgetPlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [editPlan, setEditPlan] = useState(null);
    const [editName, setEditName] = useState('');
    const [editBudget, setEditBudget] = useState(0);
    const [saving, setSaving] = useState(false);

    const fetchPlans = () => {
        setLoading(true);
        fetch('/admin/budget-plans')
            .then((r) => r.json())
            .then((d) => { setPlans(d.plans || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchPlans(); }, []);

    // We need to add a budget-plans endpoint to the admin controller
    const openEdit = (p) => { setEditPlan(p); setEditName(p.name); setEditBudget(p.budget); };
    const handleEdit = async () => {
        if (!editPlan) return;
        setSaving(true);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        try {
            const res = await fetch(`/admin/budget-plans/${editPlan.id}/edit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ name: editName, budget: editBudget }),
            });
            if (res.ok) { message.success('Budget plan updated'); setEditPlan(null); fetchPlans(); }
            else { const d = await res.json(); message.error(d.message || 'Failed'); }
        } catch { message.error('Connection error'); }
        finally { setSaving(false); }
    };

    const filtered = plans.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.username?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'User', dataIndex: ['user', 'username'], key: 'user' },
        { title: 'Budget', dataIndex: 'budget', key: 'budget', render: (v) => `$${Number(v).toFixed(2)}` },
        { title: 'Month', key: 'month', render: (_, r) => `${r.month}/${r.year}` },
        {
            title: 'Spent', key: 'spent',
            render: (_, r) => {
                const spent = r.items?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
                const pct = r.budget > 0 ? (spent / r.budget) * 100 : 0;
                return <span style={{ color: pct > 100 ? '#C62828' : pct > 75 ? '#E65100' : '#2E7D32' }}>${spent.toFixed(2)} ({pct.toFixed(0)}%)</span>;
            },
        },
        {
            title: 'Actions', key: 'actions', width: 100,
            render: (_, record) => (
                <Space size="small">
                    <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setSelectedPlan(record)} />
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                </Space>
            ),
        },
    ];

    const itemColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Category', dataIndex: 'category', key: 'category', render: (v) => v || '—' },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => `$${Number(v).toFixed(2)}` },
    ];

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <h2 className="admin-page__title" style={{ margin: 0 }}>Budget Plans</h2>
                <Input prefix={<SearchOutlined />} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} allowClear />
            </div>
            <Table
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                size="small"
                loading={loading}
                scroll={{ x: 700 }}
                expandable={{
                    expandedRowRender: (record) => (
                        <Table dataSource={record.items || []} columns={itemColumns} rowKey="id" size="small" pagination={false} />
                    ),
                }}
            />
            <Modal title="Edit Budget Plan" open={!!editPlan} onCancel={() => setEditPlan(null)} onOk={handleEdit} confirmLoading={saving} okText="Save">
                <div className="admin-login__field">
                    <label>Name</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="admin-login__field">
                    <label>Budget ($)</label>
                    <InputNumber value={editBudget} onChange={setEditBudget} min={0} step={100} style={{ width: '100%' }} />
                </div>
            </Modal>
            <Modal title={`Plan: ${selectedPlan?.name || ''}`} open={!!selectedPlan} onCancel={() => setSelectedPlan(null)} footer={null} width={600}>
                {selectedPlan && (
                    <div>
                        <p><strong>User:</strong> {selectedPlan.user?.username} ({selectedPlan.user?.email})</p>
                        <p><strong>Period:</strong> {selectedPlan.month}/{selectedPlan.year}</p>
                        <p><strong>Budget:</strong> ${Number(selectedPlan.budget).toFixed(2)}</p>
                        <h4 style={{ marginTop: 16, fontWeight: 700 }}>Items</h4>
                        <Table dataSource={selectedPlan.items || []} columns={itemColumns} rowKey="id" size="small" pagination={false} />
                    </div>
                )}
            </Modal>
        </div>
    );
}
