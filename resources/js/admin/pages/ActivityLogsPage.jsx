import React, { useState, useEffect } from 'react';
import { Table, Tag, Select, Statistic, Card, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const actionLabels = {
    'login': 'Login', 'logout': 'Logout', 'register': 'Registration',
    'create_category': 'Created Category', 'update_category': 'Updated Category', 'delete_category': 'Deleted Category',
    'create_account': 'Created Account', 'update_account': 'Updated Account', 'delete_account': 'Deleted Account',
    'create_transaction': 'Created Transaction', 'update_transaction': 'Updated Transaction', 'delete_transaction': 'Deleted Transaction',
    'create_budget': 'Created Budget', 'update_budget': 'Updated Budget', 'delete_budget': 'Deleted Budget',
    'create_budget_plan': 'Created Budget Plan', 'update_budget_plan': 'Updated Budget Plan', 'delete_budget_plan': 'Deleted Budget Plan',
    'create_budget_plan_item': 'Created Plan Item', 'update_budget_plan_item': 'Updated Plan Item', 'delete_budget_plan_item': 'Deleted Plan Item',
};

const actionColors = {
    'login': 'blue', 'logout': 'orange', 'register': 'green',
    'create_category': 'cyan', 'update_category': 'geekblue', 'delete_category': 'red',
    'create_account': 'cyan', 'update_account': 'geekblue', 'delete_account': 'red',
    'create_transaction': 'cyan', 'update_transaction': 'geekblue', 'delete_transaction': 'red',
    'create_budget': 'cyan', 'update_budget': 'geekblue', 'delete_budget': 'red',
    'create_budget_plan': 'cyan', 'update_budget_plan': 'geekblue', 'delete_budget_plan': 'red',
    'create_budget_plan_item': 'cyan', 'update_budget_plan_item': 'geekblue', 'delete_budget_plan_item': 'red',
};

export default function ActivityLogsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (actionFilter) params.set('action', actionFilter);
        fetch(`/admin/activity-logs?${params}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchLogs(); }, [actionFilter]);

    const columns = [
        { title: 'Time', dataIndex: 'created_at', key: 'time', width: 160, render: (v) => new Date(v).toLocaleString() },
        { title: 'User', key: 'user', render: (_, r) => <strong>{r.username}</strong> },
        { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
        {
            title: 'Action', dataIndex: 'action', key: 'action', width: 160,
            render: (v) => <Tag color={actionColors[v] || 'default'}>{actionLabels[v] || v}</Tag>,
        },
        {
            title: 'Details', dataIndex: 'details', key: 'details', ellipsis: true,
            render: (v) => {
                if (!v) return '—';
                try { return JSON.stringify(JSON.parse(v)); } catch { return v; }
            },
        },
        { title: 'IP', dataIndex: 'ip_address', key: 'ip', width: 130 },
    ];

    const actionOptions = Object.entries(actionLabels).map(([key, label]) => (
        <Select.Option key={key} value={key}>{label}</Select.Option>
    ));

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <h2 className="admin-page__title" style={{ margin: 0 }}>Activity Logs</h2>
                <Select
                    value={actionFilter || undefined}
                    onChange={setActionFilter}
                    placeholder="Filter by action"
                    allowClear
                    showSearch
                    style={{ width: 240 }}
                    onClear={() => setActionFilter('')}
                >
                    {actionOptions}
                </Select>
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Today" value={data?.logs_today || 0} valueStyle={{ color: '#C62828' }} /></Card></Col>
                {data?.action_counts?.slice(0, 4).map((ac) => (
                    <Col xs={12} sm={6} key={ac.action}>
                        <Card size="small" hoverable onClick={() => setActionFilter(ac.action)}>
                            <Statistic title={actionLabels[ac.action] || ac.action} value={ac.count} valueStyle={{ fontSize: 18 }} />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Table
                dataSource={data?.logs || []}
                columns={columns}
                rowKey="id"
                size="small"
                loading={loading}
                scroll={{ x: 800 }}
            />
        </div>
    );
}
