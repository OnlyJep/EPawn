import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Statistic, Table, Tag, Descriptions } from 'antd';
import { ArrowLeftOutlined, InboxOutlined, UndoOutlined } from '@ant-design/icons';

export default function UserDetailPage({ userId, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = () => {
        if (!userId) return;
        setLoading(true);
        fetch(`/admin/users/${userId}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchUser(); }, [userId]);

    const handleArchive = async () => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        await fetch(`/admin/users/${userId}/archive`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf } });
        fetchUser();
    };

    if (loading) return <div className="admin-loading-inline"><div className="admin-loading__spinner" /></div>;
    if (!data) return null;

    const { user, accounts, categories, transactions, budgets } = data;

    const catColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Name', dataIndex: 'name', key: 'name', render: (v, r) => `${r.icon || ''} ${v}` },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (v) => <Tag color={v === 'income' ? 'green' : 'red'}>{v}</Tag> },
        { title: 'Archived', dataIndex: 'archived_at', key: 'archived', render: (v) => v ? <Tag color="orange">Yes</Tag> : 'No' },
    ];

    const acctColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Balance', dataIndex: 'balance', key: 'balance', render: (v, r) => `${r.currency || ''} ${v}` },
    ];

    const txnColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: 'Amount', dataIndex: 'amount', key: 'amount' },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (v) => <Tag color={v === 'income' ? 'green' : 'red'}>{v}</Tag> },
        { title: 'Date', dataIndex: 'created_at', key: 'date', render: (v) => new Date(v).toLocaleDateString() },
    ];

    const budgetColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Limit', dataIndex: 'limit_amount', key: 'limit' },
        { title: 'Period', dataIndex: 'period', key: 'period' },
    ];

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Back to Users</Button>
                <Button icon={user.archived_at ? <UndoOutlined /> : <InboxOutlined />} onClick={handleArchive} danger={!user.archived_at}>
                    {user.archived_at ? 'Restore User' : 'Archive User'}
                </Button>
            </div>

            <Card style={{ marginBottom: 16 }}>
                <Descriptions title={user.username} column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                        {user.archived_at ? <Tag color="orange">Archived</Tag> : <Tag color="green">Active</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Google User">{user.google_id ? 'Yes' : 'No'}</Descriptions.Item>
                    <Descriptions.Item label="Joined">{new Date(user.created_at).toLocaleDateString()}</Descriptions.Item>
                    {user.archived_at && <Descriptions.Item label="Archived">{new Date(user.archived_at).toLocaleDateString()}</Descriptions.Item>}
                </Descriptions>
            </Card>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Categories" value={user.categories_count} valueStyle={{ color: '#2E7D32' }} /></Card></Col>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Accounts" value={user.accounts_count} valueStyle={{ color: '#1565C0' }} /></Card></Col>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Transactions" value={user.transactions_count} valueStyle={{ color: '#6A1B9A' }} /></Card></Col>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Budgets" value={user.budgets_count} valueStyle={{ color: '#E65100' }} /></Card></Col>
            </Row>

            {categories?.length > 0 && <>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Categories ({categories.length})</h3>
                <Table dataSource={categories} columns={catColumns} rowKey="id" size="small" pagination={false} style={{ marginBottom: 16 }} />
            </>}
            {accounts?.length > 0 && <>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Accounts ({accounts.length})</h3>
                <Table dataSource={accounts} columns={acctColumns} rowKey="id" size="small" pagination={false} style={{ marginBottom: 16 }} />
            </>}
            {transactions?.length > 0 && <>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Transactions ({transactions.length})</h3>
                <Table dataSource={transactions} columns={txnColumns} rowKey="id" size="small" pagination={false} style={{ marginBottom: 16 }} />
            </>}
            {budgets?.length > 0 && <>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Budgets ({budgets.length})</h3>
                <Table dataSource={budgets} columns={budgetColumns} rowKey="id" size="small" pagination={false} />
            </>}
        </div>
    );
}
