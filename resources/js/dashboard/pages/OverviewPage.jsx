import React, { useState, useEffect } from 'react';
import { fetchAccounts, fetchTransactions } from '../../services/epawnApi';
import { formatCurrency } from '../../constants/sheetDefaults';

const formatFriendlyDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '\u2014';
    try {
        const parts = dateTimeStr.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00';
        
        const dateParts = datePart.split('-');
        if (dateParts.length < 3) return dateTimeStr;
        
        const year = parseInt(dateParts[0]);
        const monthIndex = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);

        const timeParts = timePart.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1] || '00');

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const month = months[monthIndex];

        let displayHour = hour % 12;
        displayHour = displayHour === 0 ? 12 : displayHour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayMinute = String(minute).padStart(2, '0');

        return `${month} ${day}, ${year} ${displayHour}:${displayMinute}${ampm}`;
    } catch (e) {
        return dateTimeStr;
    }
};

export default function OverviewPage({
    user,
    stats,
}) {
    const [accounts, setAccounts] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calculatedTotals, setCalculatedTotals] = useState({ netBalance: 0, totalIncome: 0, totalExpenses: 0 });
    const displayName = user?.fullname || user?.display_name || user?.username;

    const curMonthName = new Date().toLocaleString('default', { month: 'long' });
    const curYear = new Date().getFullYear();

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [accRes, txRes] = await Promise.all([
                    fetchAccounts(),
                    fetchTransactions()
                ]);

                const accountsData = accRes.accounts || [];
                setAccounts(accountsData);

                const netBalance = accountsData.reduce((sum, row) => {
                    return sum + (parseFloat(row.balance) || 0);
                }, 0);

                const allRecords = txRes.transactions || [];
                const allTransactions = allRecords.map(row => ({
                    id: row.id,
                    date: row.date,
                    amount: parseFloat(row.amount) || 0,
                    type: (row.type || '').toLowerCase(),
                    description: row.description || 'No description',
                    category: row.category?.name || 'General',
                    isBudget: false
                }));

                const sorted = [...allTransactions].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date.replace(/-/g, '/')) : new Date(0);
                    const dateB = b.date ? new Date(b.date.replace(/-/g, '/')) : new Date(0);
                    return dateB - dateA;
                });
                setRecentTransactions(sorted.slice(0, 5));

                const now = new Date();
                const curMonth = now.getMonth();
                const curYear = now.getFullYear();

                let runningBalance = netBalance;

                const descAllTransactions = [...allTransactions].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date.replace(/-/g, '/')) : new Date(0);
                    const dateB = b.date ? new Date(b.date.replace(/-/g, '/')) : new Date(0);
                    return dateB - dateA;
                });

                const startOfCurMonth = new Date(curYear, curMonth, 1);

                descAllTransactions.forEach(row => {
                    const rowDate = row.date ? new Date(row.date.replace(/-/g, '/')) : null;
                    if (rowDate && rowDate >= startOfCurMonth) {
                        const amount = row.amount || 0;
                        const type = row.type || '';
                        if (type === 'income') {
                            runningBalance -= amount;
                        } else if (type === 'expense') {
                            runningBalance += amount;
                        }
                    }
                });

                const initialMonthBalance = runningBalance;

                const curMonthTransactions = allTransactions.filter(row => {
                    const dateStr = row.date || '';
                    if (!dateStr) return false;
                    const datePart = dateStr.split(' ')[0];
                    const parts = datePart.split('-');
                    if (parts.length < 3) return false;
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    return month === curMonth && year === curYear;
                }).sort((a, b) => {
                    const dateA = a.date ? new Date(a.date.replace(/-/g, '/')) : new Date(0);
                    const dateB = b.date ? new Date(b.date.replace(/-/g, '/')) : new Date(0);
                    return dateA - dateB;
                });

                const points = [];
                points.push({
                    day: 1,
                    dateStr: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-01 00:00`,
                    balance: initialMonthBalance,
                    change: 0,
                    description: 'Beginning of Month',
                    type: 'Starting'
                });

                let currentBal = initialMonthBalance;
                curMonthTransactions.forEach(row => {
                    const amount = row.amount || 0;
                    const type = row.type || '';
                    const dateStr = row.date || '';
                    const day = parseInt(dateStr.split(' ')[0].split('-')[2]) || 1;

                    if (type === 'income') {
                        currentBal += amount;
                        points.push({
                            day,
                            dateStr,
                            balance: currentBal,
                            change: amount,
                            description: row.description || 'Income',
                            type: 'Income'
                        });
                    } else if (type === 'expense') {
                        currentBal -= amount;
                        points.push({
                            day,
                            dateStr,
                            balance: currentBal,
                            change: -amount,
                            description: row.description || 'Expense',
                            type: 'Expense'
                        });
                    } else if (type === 'transfer') {
                        points.push({
                            day,
                            dateStr,
                            balance: currentBal,
                            change: 0,
                            description: row.description || 'Transfer',
                            type: 'Transfer'
                        });
                    }
                });

                const today = now.getDate();
                if (points[points.length - 1]?.day < today) {
                    points.push({
                        day: today,
                        dateStr: now.toISOString().split('T')[0] + ' 23:59',
                        balance: currentBal,
                        change: 0,
                        description: 'Current State',
                        type: 'Current'
                    });
                }

                setTrendData(points);

                let totalIncome = 0;
                let totalExpenses = 0;

                allRecords.forEach(row => {
                    const type = (row.type || '').toLowerCase();
                    const amount = parseFloat(row.amount) || 0;
                    if (type.includes('income')) {
                        totalIncome += amount;
                    } else if (type.includes('expense')) {
                        totalExpenses += amount;
                    }
                });

                setCalculatedTotals({
                    netBalance,
                    totalIncome,
                    totalExpenses
                });
            } catch (error) {
                console.error('Failed to load overview data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [stats]);

    const balances = trendData.map(p => p.balance);
    const maxBal = balances.length > 0 ? Math.max(...balances) : stats?.totalSaved || 1000;
    const minBal = balances.length > 0 ? Math.min(...balances) : stats?.totalSaved || 0;
    const pad = (maxBal - minBal) * 0.15 || 500;
    const yMin = minBal - pad;
    const yMax = maxBal + pad;

    const coords = trendData.map(pt => {
        const x = 50 + ((pt.day - 1) / 30) * 520;
        const y = 190 - ((pt.balance - yMin) / (yMax - yMin)) * 150;
        return { ...pt, x, y };
    });

    const linePath = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const areaPath = coords.length > 0 
        ? `${linePath} L ${coords[coords.length - 1].x} 190 L ${coords[0].x} 190 Z` 
        : '';

    return (
        <div className="overview-page">
            <div className="overview-card overview-card--welcome">
                <h2>Hello, {displayName}!</h2>
                <p>Welcome back to E-PAWN. Here is your financial summary.</p>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="overview-card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-300)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Net Balance</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: calculatedTotals.netBalance >= 0 ? 'var(--green, #10b981)' : 'var(--red, #ef4444)' }}>
                        {formatCurrency(calculatedTotals.netBalance)}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>Total funds across all accounts</p>
                </div>

                <div className="overview-card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-300)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Total Income</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green, #10b981)' }}>
                        {formatCurrency(calculatedTotals.totalIncome)}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>All-time logged income</p>
                </div>

                <div className="overview-card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-300)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Total Expenses</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--red, #ef4444)' }}>
                        {formatCurrency(calculatedTotals.totalExpenses)}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>All-time logged spending</p>
                </div>
            </div>

            <div className="overview-card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-300)', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--red)', marginBottom: '0.25rem' }}>Savings & Spending Trend</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>Visual balance changes for {curMonthName} {curYear}. Hover over data points to check transaction logs.</p>
                
                {trendData.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No trend data for this month.</p>
                ) : (
                    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                        <svg viewBox="0 0 600 220" style={{ width: '100%', height: 'auto', minWidth: '550px' }}>
                            <defs>
                                <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--red)" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="var(--red)" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            <line x1="50" y1="40" x2="570" y2="40" stroke="var(--gray-200)" strokeDasharray="4 4" />
                            <line x1="50" y1="115" x2="570" y2="115" stroke="var(--gray-200)" strokeDasharray="4 4" />
                            <line x1="50" y1="190" x2="570" y2="190" stroke="var(--gray-200)" strokeDasharray="4 4" />

                            <text x="40" y="45" fill="var(--gray-400)" fontSize="9" textAnchor="end">{formatCurrency(yMax)}</text>
                            <text x="40" y="120" fill="var(--gray-400)" fontSize="9" textAnchor="end">{formatCurrency((yMax + yMin) / 2)}</text>
                            <text x="40" y="195" fill="var(--gray-400)" fontSize="9" textAnchor="end">{formatCurrency(yMin)}</text>

                            {areaPath && <path d={areaPath} fill="url(#glowGrad)" />}

                            {linePath && <path d={linePath} fill="none" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 2px 4px rgba(198,40,40,0.15))' }} />}

                            <text x="50" y="210" fill="var(--gray-400)" fontSize="10" textAnchor="middle">1st</text>
                            <text x="223" y="210" fill="var(--gray-400)" fontSize="10" textAnchor="middle">10th</text>
                            <text x="396" y="210" fill="var(--gray-400)" fontSize="10" textAnchor="middle">20th</text>
                            <text x="570" y="210" fill="var(--gray-400)" fontSize="10" textAnchor="middle">30th</text>

                            {coords.map((pt, i) => {
                                if (pt.type === 'Starting' || pt.type === 'Current') return null;
                                return (
                                    <g key={i}>
                                        <circle cx={pt.x} cy={pt.y} r="5" fill="var(--red)" stroke="var(--white)" strokeWidth="2" />
                                        <circle
                                            cx={pt.x}
                                            cy={pt.y}
                                            r="12"
                                            fill="transparent"
                                            cursor="pointer"
                                            onMouseEnter={() => setHoveredPoint(pt)}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        {hoveredPoint && (
                            <div style={{
                                position: 'absolute',
                                left: `${hoveredPoint.x + 10}px`,
                                top: `${hoveredPoint.y - 65}px`,
                                background: 'rgba(31, 41, 55, 0.95)',
                                color: 'var(--white)',
                                padding: '0.6rem 0.9rem',
                                borderRadius: '10px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                                fontSize: '0.75rem',
                                pointerEvents: 'none',
                                zIndex: 10,
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <strong style={{ color: 'var(--white)' }}>{hoveredPoint.description}</strong><br/>
                                <span style={{ color: 'var(--gray-300)' }}>{formatFriendlyDateTime(hoveredPoint.dateStr)}</span><br/>
                                Running Balance: <span style={{ color: 'var(--red-light)', fontWeight: 800 }}>{formatCurrency(hoveredPoint.balance)}</span><br/>
                                Type: <span style={{ fontWeight: 800, color: hoveredPoint.change >= 0 ? '#10b981' : '#f87171' }}>
                                    {hoveredPoint.type} ({hoveredPoint.change >= 0 ? '+' : ''}{formatCurrency(hoveredPoint.change)})
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
                <div className="overview-card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-300)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>My Accounts</h3>
                    {loading ? (
                        <p>Loading accounts...</p>
                    ) : accounts.length === 0 ? (
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No accounts created yet. Go to the Accounts section to add one.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {accounts.map((row) => (
                                <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{row.name || 'Unnamed Account'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Bank</div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: (parseFloat(row.balance) || 0) >= 0 ? 'var(--gray-800)' : 'var(--red)' }}>
                                        {formatCurrency(parseFloat(row.balance) || 0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overview-card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--white)', border: '1px solid var(--gray-300)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Recent Transactions</h3>
                    {loading ? (
                        <p>Loading transactions...</p>
                    ) : recentTransactions.length === 0 ? (
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No transactions recorded yet. Go to the Records section to add one.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentTransactions.map((row) => {
                                const isExpense = (row.type || '').toLowerCase().includes('expense');
                                return (
                                    <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.description || 'No description'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                {formatFriendlyDateTime(row.date)} &bull; {row.category || 'General'}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: isExpense ? 'var(--red, #ef4444)' : 'var(--green, #10b981)' }}>
                                            {isExpense ? '-' : '+'}{formatCurrency(row.amount)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
