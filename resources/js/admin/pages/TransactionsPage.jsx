import React, { useState, useEffect, useCallback } from 'react';
import { Table, Select, Tag, Card, Row, Col, Statistic } from 'antd';
import { TransactionOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [typeFilter, setTypeFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter) params.append('type', typeFilter);
            const res = await fetch(`/admin/transactions?${params}`);
            const data = await res.json();
            setTransactions(data.transactions || []);
        } catch { setTransactions([]); }
        setLoading(false);
    }, [typeFilter]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
    }, { income: 0, expense: 0 });

    const columns = [
        {
            title: 'User', dataIndex: 'username', key: 'username',
            render: (name, r) => <strong>{name}</strong>,
        },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Type', dataIndex: 'type', key: 'type',
            render: (type) => (
                <Tag color={type === 'income' ? 'green' : 'red'} icon={type === 'income' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
                    {type?.charAt(0).toUpperCase() + type?.slice(1)}
                </Tag>
            ),
        },
        {
            title: 'Amount', dataIndex: 'amount', key: 'amount',
            render: (amount, r) => (
                <span style={{ color: r.type === 'income' ? 'var(--green, #2e7d32)' : 'var(--red, #DC143C)', fontWeight: 600 }}>
                    {r.type === 'income' ? '+' : '-'}₱{parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            title: 'Category', key: 'category',
            render: (_, r) => r.category?.name || <Tag>Uncategorized</Tag>,
        },
        {
            title: 'Account', key: 'account',
            render: (_, r) => r.account?.name || '—',
        },
        { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (d) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    ];

    return (
        <div className="admin-page">
            <h2 className="admin-page__title" style={{ marginBottom: '0.5rem' }}>Transactions</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>View all transactions across all users</p>

            <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="Total Transactions" value={transactions.length} prefix={<TransactionOutlined />} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="Total Income" value={totals.income} prefix="₱" precision={2} valueStyle={{ color: 'var(--green, #2e7d32)' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="Total Expenses" value={totals.expense} prefix="₱" precision={2} valueStyle={{ color: '#DC143C' }} /></Card>
                </Col>
            </Row>

            <Card>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Filter by type:</span>
                    <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 160 }} allowClear placeholder="All types">
                        <Select.Option value="income">Income</Select.Option>
                        <Select.Option value="expense">Expense</Select.Option>
                    </Select>
                </div>
                <Table
                    dataSource={transactions}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 25, showSizeChanger: true, showTotal: (t) => `${t} transactions` }}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'No transactions found' }}
                />
            </Card>
        </div>
    );
}
