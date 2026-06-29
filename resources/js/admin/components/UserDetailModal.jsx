import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Table, Button, Tag, Form, Input, Select, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../constants/sheetDefaults';

export default function UserDetailModal({ userId, visible, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Edit modals
    const [editCategory, setEditCategory] = useState(null);
    const [editAccount, setEditAccount] = useState(null);
    const [editPlan, setEditPlan] = useState(null);
    const [viewPlan, setViewPlan] = useState(null);

    // Form
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content;

    const fetchData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(`/admin/users/${userId}`);
            const d = await res.json();
            setData(d);
        } catch { setData(null); }
        setLoading(false);
    };

    useEffect(() => {
        if (visible && userId) fetchData();
    }, [visible, userId]);

    const handleEditCategory = async (values) => {
        setSaving(true);
        await fetch(`/admin/categories/${editCategory.id}/edit`, {
            method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        message.success('Category updated');
        setEditCategory(null);
        setSaving(false);
        fetchData();
    };

    const handleDeleteCategory = async (id) => {
        await fetch(`/admin/categories/${id}/delete`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } });
        message.success('Category archived');
        fetchData();
    };

    const handleEditAccount = async (values) => {
        setSaving(true);
        await fetch(`/admin/accounts/${editAccount.id}/edit`, {
            method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        message.success('Account updated');
        setEditAccount(null);
        setSaving(false);
        fetchData();
    };

    const handleDeleteAccount = async (id) => {
        await fetch(`/admin/accounts/${id}/delete`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } });
        message.success('Account deleted');
        fetchData();
    };

    const handleEditPlan = async (values) => {
        setSaving(true);
        await fetch(`/admin/budget-plans/${editPlan.id}/edit`, {
            method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        message.success('Budget plan updated');
        setEditPlan(null);
        setSaving(false);
        fetchData();
    };

    const handleDeletePlan = async (id) => {
        await fetch(`/admin/budget-plans/${id}/delete`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } });
        message.success('Budget plan deleted');
        fetchData();
    };

    if (!data) return null;

    const { user, categories, accounts, budget_plans } = data;

    const catColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', render: (v, r) => `${r.icon || ''} ${v}` },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (v) => <Tag color={v === 'income' ? 'green' : 'red'}>{v}</Tag> },
        { title: 'Status', dataIndex: 'archived_at', key: 'status', render: (v) => v ? <Tag color="default">Archived</Tag> : <Tag color="green">Active</Tag> },
        {
            title: 'Actions', key: 'actions', width: 140,
            render: (_, r) => (
                <span style={{ display: 'flex', gap: 12 }}>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditCategory(r); form.setFieldsValue({ name: r.name, type: r.type }); }} />
                    <Popconfirm title="Archive this category?" onConfirm={() => handleDeleteCategory(r.id)} okText="Archive" cancelText="Cancel">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </span>
            ),
        },
    ];

    const accColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Balance', dataIndex: 'balance', key: 'balance', render: (v) => <strong>{formatCurrency(v || 0)}</strong> },
        { title: 'Initial', dataIndex: 'initial_balance', key: 'initial', render: (v) => formatCurrency(v || 0) },
        { title: 'Icon', dataIndex: 'icon', key: 'icon', render: (v) => v ? <img src={v} alt="" style={{ width: 24, height: 24 }} /> : '-' },
        {
            title: 'Actions', key: 'actions', width: 140,
            render: (_, r) => (
                <span style={{ display: 'flex', gap: 12 }}>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditAccount(r); form.setFieldsValue({ name: r.name, balance: r.balance, icon: r.icon }); }} />
                    <Popconfirm title="Delete this account?" onConfirm={() => handleDeleteAccount(r.id)} okText="Delete" okType="danger" cancelText="Cancel">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </span>
            ),
        },
    ];

    const planColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Budget', dataIndex: 'budget', key: 'budget', render: (v) => <strong>{formatCurrency(v || 0)}</strong> },
        { title: 'Month', dataIndex: 'month', key: 'month', render: (v, r) => {
            const d = new Date(r.year, v - 1);
            return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }},
        { title: 'Items', dataIndex: 'items', key: 'items', render: (items) => items?.length || 0 },
        {
            title: 'Actions', key: 'actions', width: 180,
            render: (_, r) => (
                <span style={{ display: 'flex', gap: 8 }}>
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewPlan(r)} />
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditPlan(r); form.setFieldsValue({ name: r.name, budget: r.budget }); }} />
                    <Popconfirm title="Delete this budget plan?" onConfirm={() => handleDeletePlan(r.id)} okText="Delete" okType="danger" cancelText="Cancel">
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </span>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'categories',
            label: `Categories (${categories?.length || 0})`,
            children: (
                <Table dataSource={categories || []} columns={catColumns} rowKey="id" size="small" pagination={false} loading={loading}
                    locale={{ emptyText: 'No categories' }} />
            ),
        },
        {
            key: 'accounts',
            label: `Accounts (${accounts?.length || 0})`,
            children: (
                <Table dataSource={accounts || []} columns={accColumns} rowKey="id" size="small" pagination={false} loading={loading}
                    locale={{ emptyText: 'No accounts' }} />
            ),
        },
        {
            key: 'plans',
            label: `Budget Plans (${budget_plans?.length || 0})`,
            children: (
                <Table dataSource={budget_plans || []} columns={planColumns} rowKey="id" size="small" pagination={false} loading={loading}
                    locale={{ emptyText: 'No budget plans' }}
                    expandable={{
                        expandedRowRender: (r) => (
                            <div style={{ padding: '0.5rem 0' }}>
                                <strong>Items:</strong>
                                {r.items?.length > 0 ? (
                                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: 20 }}>
                                        {r.items.map((item) => (
                                            <li key={item.id} style={{ marginBottom: 4 }}>
                                                {item.name} — {formatCurrency(item.amount || 0)}
                                                {item.category ? <Tag style={{ marginLeft: 8 }}>{item.category}</Tag> : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p style={{ color: '#999', margin: '0.5rem 0 0' }}>No items</p>}
                            </div>
                        ),
                    }}
                />
            ),
        },
    ];

    return (
        <>
            <Modal
                title={`${user?.username || 'User'} — Details`}
                open={visible}
                onCancel={onClose}
                footer={<Button onClick={onClose}>Close</Button>}
                width={800}
                styles={{ body: { paddingTop: 8 } }}
            >
                <Tabs items={tabItems} />
            </Modal>

            {/* Edit Category Modal */}
            <Modal title="Edit Category" open={!!editCategory} onCancel={() => setEditCategory(null)} footer={null} width={400}>
                <Form form={form} layout="vertical" onFinish={handleEditCategory}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving} block>Save</Button>
                </Form>
            </Modal>

            {/* Edit Account Modal */}
            <Modal title="Edit Account" open={!!editAccount} onCancel={() => setEditAccount(null)} footer={null} width={400}>
                <Form form={form} layout="vertical" onFinish={handleEditAccount}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="balance" label="Balance" rules={[{ required: true }]}>
                        <Input type="number" step="0.01" />
                    </Form.Item>
                    <Form.Item name="icon" label="Icon URL">
                        <Input placeholder="/img/accicons/walleticon.png" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving} block>Save</Button>
                </Form>
            </Modal>

            {/* Edit Budget Plan Modal */}
            <Modal title="Edit Budget Plan" open={!!editPlan} onCancel={() => setEditPlan(null)} footer={null} width={400}>
                <Form form={form} layout="vertical" onFinish={handleEditPlan}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="budget" label="Budget" rules={[{ required: true }]}>
                        <Input type="number" step="0.01" min="0" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving} block>Save</Button>
                </Form>
            </Modal>

            {/* View Budget Plan Items Modal */}
            <Modal title={viewPlan?.name || 'Budget Plan Items'} open={!!viewPlan} onCancel={() => setViewPlan(null)} footer={null} width={600}>
                {viewPlan && (
                    <div>
                        <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                            <p><strong>Budget:</strong> {formatCurrency(viewPlan.budget || 0)}</p>
                            <p><strong>Month:</strong> {new Date(viewPlan.year, viewPlan.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            <p><strong>Total Items:</strong> {viewPlan.items?.length || 0}</p>
                        </div>
                        {viewPlan.items?.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: 8, textAlign: 'left' }}>Category</th>
                                        <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewPlan.items.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: 8 }}>{item.name}</td>
                                            <td style={{ padding: 8 }}>{item.category || '-'}</td>
                                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p style={{ color: '#999', textAlign: 'center', padding: 24 }}>No items in this plan.</p>}
                    </div>
                )}
            </Modal>
        </>
    );
}
