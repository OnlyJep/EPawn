import React, { useState, useEffect } from 'react';
import { message, Modal, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    fetchCategories,
    fetchAccounts,
    fetchTransactions,
    createTransaction,
    createCategory,
    createAccount,
} from '../../services/epawnApi';
import { formatCurrency } from '../../constants/sheetDefaults';

const evaluateExpr = (expr) => {
    try {
        const sanitized = expr.replace(/x/g, '*').replace(/÷/g, '/');
        if (/^[0-9.+\-*/\s()]+$/.test(sanitized)) {
            const val = eval(sanitized);
            return Number(val.toFixed(2));
        }
    } catch (e) {
        console.error(e);
    }
    return null;
};

const ACC_ICONS = [
    { name: 'Wallet', src: '/img/accicons/walleticon.png' },
    { name: 'Card', src: '/img/accicons/bankcardicon.png' },
    { name: 'Cash', src: '/img/accicons/cashicon.png' },
    { name: 'Coin', src: '/img/accicons/coinicon.png' },
    { name: 'Piggy', src: '/img/accicons/piggyicon.png' }
];

export default function BudgetPage({
    onStatsUpdate,
    onRefreshSheets
}) {
    const [rows, setRows] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [spendingMap, setSpendingMap] = useState({});
    const [loading, setLoading] = useState(false);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [txModalOpen, setTxModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const [category, setCategory] = useState('');
    const [limit, setLimit] = useState('');

    const [txDate, setTxDate] = useState('');
    const [txTime, setTxTime] = useState('');
    const [txDescription, setTxDescription] = useState('');
    const [txCategory, setTxCategory] = useState('');
    const [txAccount, setTxAccount] = useState('');
    const [txType, setTxType] = useState('Expense');
    const [txCalcExpression, setTxCalcExpression] = useState('0');
    const [txCalcResult, setTxCalcResult] = useState(null);

    const [selectingAccountFor, setSelectingAccountFor] = useState(null);
    const [selectingCategory, setSelectingCategory] = useState(false);

    const [createAccModalOpen, setCreateAccModalOpen] = useState(false);
    const [newAccName, setNewAccName] = useState('');
    const [newAccInitial, setNewAccInitial] = useState('');
    const [newAccIcon, setNewAccIcon] = useState('/img/accicons/walleticon.png');

    const [createCatModalOpen, setCreateCatModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    const [txBtnHover, setTxBtnHover] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    // Build lookup maps
    const categoryNameToId = {};
    (categories || []).forEach(c => { categoryNameToId[c.name] = c.id; });
    const accountNameToId = {};
    (accounts || []).forEach(a => { accountNameToId[a.name] = a.id; });

    useEffect(() => {
        if (!txModalOpen) return;

        const handleKeyDown = (e) => {
            if (document.activeElement && (
                document.activeElement.tagName === 'TEXTAREA' || 
                document.activeElement.tagName === 'INPUT'
            )) {
                return;
            }

            const key = e.key;
            if (/[0-9]/.test(key)) {
                e.preventDefault();
                handleKeypadPress(key);
            } else if (key === '.') {
                e.preventDefault();
                handleKeypadPress('.');
            } else if (key === '+') {
                e.preventDefault();
                handleKeypadPress('+');
            } else if (key === '-') {
                e.preventDefault();
                handleKeypadPress('-');
            } else if (key === '*') {
                e.preventDefault();
                handleKeypadPress('*');
            } else if (key === '/') {
                e.preventDefault();
                handleKeypadPress('/');
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                handleKeypadPress('=');
            } else if (key === 'Backspace') {
                e.preventDefault();
                setTxCalcResult(null);
                setTxCalcExpression(prev => {
                    if (prev.length <= 1) return '0';
                    return prev.slice(0, -1);
                });
            } else if (key.toLowerCase() === 'c' || key === 'Escape') {
                e.preventDefault();
                setTxCalcExpression('0');
                setTxCalcResult(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [txModalOpen, txCalcExpression, txCalcResult]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [budgetRes, catRes, accRes, txRes] = await Promise.all([
                fetchBudgets(),
                fetchCategories(),
                fetchAccounts(),
                fetchTransactions()
            ]);
            setRows(budgetRes.budgets || []);
            setCategories(catRes.categories || []);
            setAccounts(accRes.accounts || []);

            const map = {};
            (txRes.transactions || []).forEach(row => {
                const type = (row.type || '').toLowerCase();
                if (type.includes('expense')) {
                    const cat = row.category?.name || 'General';
                    const amt = parseFloat(row.amount) || 0;
                    map[cat] = (map[cat] || 0) + amt;
                }
            });
            setSpendingMap(map);
        } catch (error) {
            console.error(error);
            message.error('Failed to load budgets.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEditModal = (row) => {
        setEditingRow(row);
        setCategory(row.category?.name || '');
        setLimit(row.limit_amount || '');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category || !limit || parseFloat(limit) <= 0) {
            message.error('Please fill in all required fields.');
            return;
        }

        const payload = {
            category_id: categoryNameToId[category] || null,
            limit_amount: parseFloat(limit),
            period: 'monthly'
        };

        try {
            if (editingRow) {
                await updateBudget(editingRow.id, payload);
                message.success('Budget updated successfully.');
            }
            setModalOpen(false);
            loadData();
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            message.error('Failed to save budget.');
        }
    };

    const handleDelete = async (rowId) => {
        Modal.confirm({
            title: 'Delete Budget Limit',
            content: 'Are you sure you want to delete this budget limit?',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteBudget(rowId);
                    message.success('Budget limit deleted.');
                    loadData();
                    if (onRefreshSheets) onRefreshSheets();
                } catch (error) {
                    message.error('Failed to delete budget.');
                }
            }
        });
    };

    const handleCreateAccSubmit = async (e) => {
        e.preventDefault();
        if (!newAccName || newAccInitial === '') {
            message.error('Please fill in Name and Initial Amount.');
            return;
        }

        const amtVal = parseFloat(newAccInitial) || 0;
        const payload = {
            name: newAccName,
            initial_balance: amtVal,
            icon: newAccIcon
        };

        try {
            await createAccount(payload);
            message.success('Account added.');
            await loadData();
            
            if (selectingAccountFor === 'account' || selectingAccountFor === 'fromAccount') {
                setTxAccount(newAccName);
            } else if (selectingAccountFor === 'toAccount') {
                setTxCategory(newAccName);
            }
            
            setCreateAccModalOpen(false);
            setSelectingAccountFor(null);
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            message.error('Failed to save account.');
        }
    };

    const handleCreateCatSubmit = async (e) => {
        e.preventDefault();
        if (!newCatName) {
            message.error('Please enter Category Name.');
            return;
        }

        const payload = {
            name: newCatName,
            type: txType.toLowerCase()
        };

        try {
            await createCategory(payload);
            message.success('Category added.');
            await loadData();
            
            setTxCategory(newCatName);
            setCreateCatModalOpen(false);
            setSelectingCategory(false);
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            message.error('Failed to save category.');
        }
    };

    const openTxModal = () => {
        setTxDate(new Date().toISOString().split('T')[0]);
        
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        setTxTime(`${hrs}:${mins}`);

        setTxDescription('');
        
        const expCats = categories.filter(c => (c.type || '').toLowerCase().includes('expense'));
        setTxCategory(expCats[0]?.name || 'General');
        setTxAccount(accounts[0]?.name || 'Cash');
        
        setTxCalcExpression('0');
        setTxType('Expense');
        setTxModalOpen(true);
    };

    const handleTxSubmit = async (e) => {
        e.preventDefault();
        
        let amtVal = evaluateExpr(txCalcExpression);
        if (amtVal === null) {
            amtVal = parseFloat(txCalcExpression) || 0;
        }

        if (amtVal <= 0) {
            message.error('Please enter a valid amount greater than 0.');
            return;
        }

        if (!txDate) {
            message.error('Please select a date.');
            return;
        }

        if (!txAccount || txAccount === 'Choose an Account') {
            message.error('Please select an account.');
            return;
        }

        if (!txCategory || txCategory === 'Choose a Category' || txCategory === 'Choose an Account') {
            message.error('Please select a category.');
            return;
        }

        if (txType === 'Expense' || txType === 'Transfer') {
            const account = accounts.find(acc => acc.name === txAccount);
            const accountBalance = account ? parseFloat(account.balance) || 0 : 0;
            
            if (amtVal > accountBalance) {
                message.error(`Insufficient balance. Account "${txAccount}" has \u20B1${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} but you're trying to expense \u20B1${amtVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
                return;
            }
        }

        const combinedDate = `${txDate} ${txTime}`;

        const payload = {
            account_id: accountNameToId[txAccount] || null,
            category_id: categoryNameToId[txCategory] || null,
            type: txType.toLowerCase(),
            amount: amtVal,
            description: txDescription,
            date: combinedDate,
        };

        try {
            await createTransaction(payload);
            message.success('Transaction logged successfully.');
            setTxModalOpen(false);
            loadData();
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            message.error('Failed to save record.');
        }
    };

    const handleKeypadPress = (key) => {
        if (key === '=') {
            const evaluated = evaluateExpr(txCalcExpression);
            if (evaluated !== null) {
                setTxCalcResult(evaluated);
            } else {
                message.error('Invalid expression.');
            }
        } else {
            setTxCalcResult(null);

            const isOperator = ['+', '-', '*', '/'].includes(key);
            let char = key;
            if (key === '*') char = 'x';
            if (key === '/') char = '\u00f7';
            if (isOperator) char = ` ${char} `;

            if (txCalcExpression === '0' && !isOperator && key !== '.') {
                setTxCalcExpression(char);
            } else {
                setTxCalcExpression(prev => prev + char);
            }
        }
    };

    const calcKeyStyle = (keyType) => {
        let bg = '#f3f4f6';
        let color = '#1f2937';
        if (keyType === 'op') {
            bg = 'var(--red-light)';
            color = 'var(--red)';
        } else if (keyType === 'equals') {
            bg = 'var(--red)';
            color = 'var(--white)';
        }
        return {
            width: '100%',
            padding: '0.85rem',
            fontSize: '1.25rem',
            fontWeight: 700,
            borderRadius: '8px',
            border: '1px solid var(--gray-300)',
            cursor: 'pointer',
            transition: 'all 0.1s ease',
            background: bg,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        };
    };

    const openTxModalWithCategory = (categoryName, categoryType) => {
        setEditingRow(null);
        setTxDate(new Date().toISOString().split('T')[0]);
        
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        setTxTime(`${hrs}:${mins}`);
        
        setTxDescription('');
        setTxCategory(categoryName);
        setTxAccount(accounts[0]?.name || 'Cash');
        setTxCalcExpression('0');
        setTxType(categoryType);
        setTxModalOpen(true);
    };

    return (
        <div className="budget-page" style={{ padding: '2rem', background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--gray-300)', position: 'relative' }}>
            
            <button
                type="button"
                onClick={openTxModal}
                className="mobile-fab"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--red)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
            >
                +
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--red)', fontWeight: 700, margin: 0 }}>Budget</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>Set limits and add transactions by category.</p>
                </div>
                <div className="desktop-create-btn">
                    <button
                        type="button"
                        style={{
                            borderRadius: '12px',
                            border: '2px solid var(--red)',
                            color: txBtnHover ? '#ffffff' : 'var(--red)',
                            background: txBtnHover ? 'var(--red)' : 'transparent',
                            fontWeight: 700,
                            padding: '0.5rem 1.5rem',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                        }}
                        onMouseEnter={() => setTxBtnHover(true)}
                        onMouseLeave={() => setTxBtnHover(false)}
                        onClick={openTxModal}
                    >
                        + ADD TRANSACTION
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Loading budget limits...</p>
            ) : (
                <>
                    {Math.ceil(rows.length / rowsPerPage) > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Page {currentPage} of {Math.ceil(rows.length / rowsPerPage)} ({rows.length} total)</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1.5px solid var(--gray-300)', background: currentPage === 1 ? 'var(--gray-100)' : 'var(--white)', color: currentPage === 1 ? 'var(--gray-400)' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(rows.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(rows.length / rowsPerPage)}
                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1.5px solid var(--gray-300)', background: currentPage === Math.ceil(rows.length / rowsPerPage) ? 'var(--gray-100)' : 'var(--white)', color: currentPage === Math.ceil(rows.length / rowsPerPage) ? 'var(--gray-400)' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.8rem', cursor: currentPage === Math.ceil(rows.length / rowsPerPage) ? 'not-allowed' : 'pointer' }}>Next</button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((row) => {
                        const cat = row.category?.name || 'General';
                        const lim = parseFloat(row.limit_amount) || 0;
                        const spent = spendingMap[cat] || 0;
                        const pct = lim > 0 ? Math.min(100, (spent / lim) * 100) : 0;
                        const isOver = spent > lim;

                        return (
                            <div key={row.id} style={{
                                padding: '1.25rem',
                                border: '1.5px solid var(--gray-300)',
                                borderRadius: '16px',
                                background: 'var(--white)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gray-900)' }}>{cat}</span>
                                    
                                    <div className="mobile-actions-first" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(row);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '1rem',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                                lineHeight: 1,
                                                color: 'var(--gray-600)',
                                                transition: 'color 0.2s'
                                            }}
                                            title="Edit"
                                            onMouseEnter={(e) => e.target.style.color = 'var(--red)'}
                                            onMouseLeave={(e) => e.target.style.color = 'var(--gray-600)'}
                                        >
                                            <EditOutlined />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(row.id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '1rem',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                                lineHeight: 1,
                                                color: 'var(--gray-600)',
                                                transition: 'color 0.2s'
                                            }}
                                            title="Delete"
                                            onMouseEnter={(e) => e.target.style.color = 'var(--red)'}
                                            onMouseLeave={(e) => e.target.style.color = 'var(--gray-600)'}
                                        >
                                            <DeleteOutlined />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                                    <span>Spent: <strong style={{ color: 'var(--gray-800)' }}>{formatCurrency(spent)}</strong></span>
                                    <span>Limit: <strong style={{ color: 'var(--gray-800)' }}>{formatCurrency(lim)}</strong></span>
                                </div>
                                <div style={{ width: '100%', height: '10px', background: 'var(--gray-200)', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        background: isOver ? 'var(--red)' : '#10b981',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                {isOver && (
                                    <div style={{ marginTop: '0.5rem', color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700 }}>
                                        ⚠️ Alert: Over budget by {formatCurrency(spent - lim)}!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                </>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    color: 'var(--gray-500)', 
                    textTransform: 'uppercase', 
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid var(--gray-200)'
                }}>
                    Income Categories
                </div>
                {loading ? (
                    <p>Loading categories...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {categories.filter(c => (c.type || '').toLowerCase().includes('income')).map((cat) => (
                            <div key={cat.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                border: '1.5px solid var(--gray-300)',
                                borderRadius: '12px',
                                background: 'var(--white)'
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
                                    {cat.name || 'Unnamed'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => openTxModalWithCategory(cat.name, 'Income')}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--red)',
                                        background: 'var(--red)',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    SET
                                </button>
                            </div>
                        ))}
                        {categories.filter(c => (c.type || '').toLowerCase().includes('income')).length === 0 && (
                            <p style={{ color: 'var(--gray-500)', gridColumn: '1 / -1' }}>No income categories found.</p>
                        )}
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    color: 'var(--gray-500)', 
                    textTransform: 'uppercase', 
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid var(--gray-200)'
                }}>
                    Expense Categories
                </div>
                {loading ? (
                    <p>Loading categories...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {categories.filter(c => (c.type || '').toLowerCase().includes('expense')).map((cat) => (
                            <div key={cat.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                border: '1.5px solid var(--gray-300)',
                                borderRadius: '12px',
                                background: 'var(--white)'
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
                                    {cat.name || 'Unnamed'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => openTxModalWithCategory(cat.name, 'Expense')}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--red)',
                                        background: 'var(--red)',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    SET
                                </button>
                            </div>
                        ))}
                        {categories.filter(c => (c.type || '').toLowerCase().includes('expense')).length === 0 && (
                            <p style={{ color: 'var(--gray-500)', gridColumn: '1 / -1' }}>No expense categories found.</p>
                        )}
                    </div>
                )}
            </div>

            <Modal
                title={editingRow ? 'Edit Budget Limit' : 'Set Budget Limit'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                styles={{ body: { padding: '1.5rem' } }}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.35rem' }}>Category :</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-control"
                        >
                            {categories.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                            {categories.length === 0 && <option value="General">General</option>}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.35rem' }}>Limit Amount :</label>
                        <input
                            type="number"
                            step="0.01"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            className="form-control"
                            placeholder="₱ 0.00"
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>
                            Save
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={txModalOpen}
                onCancel={() => setTxModalOpen(false)}
                footer={null}
                closable={false}
                styles={{ body: { padding: '1.25rem' } }}
            >
                <form id="transaction-form" onSubmit={handleTxSubmit}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <button 
                            type="button" 
                            onClick={() => setTxModalOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            ✕ CANCEL
                        </button>
                        <button 
                            type="submit" 
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            ✓ SAVE
                        </button>
                    </div>

                    <div style={{
                        border: '1.5px solid var(--gray-300)',
                        borderRadius: '12px',
                        display: 'flex',
                        overflow: 'hidden',
                        background: 'var(--white)',
                        marginBottom: '1.25rem'
                    }}>
                        {['Income', 'Expense', 'Transfer'].map(t => {
                            const isSelected = txType === t;
                            return (
                                <div
                                    key={t}
                                    onClick={() => {
                                        setTxType(t);
                                        if (t === 'Transfer') {
                                            setTxCategory('Transfer');
                                        } else {
                                            const matchingCats = categories.filter(c => (c.type || '').toLowerCase().includes(t.toLowerCase()));
                                            setTxCategory(matchingCats[0]?.name || 'General');
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.35rem',
                                        background: isSelected ? 'var(--red-light)' : 'transparent',
                                        color: isSelected ? 'var(--red)' : 'var(--gray-500)',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s',
                                        borderRight: t !== 'Transfer' ? '1.5px solid var(--gray-300)' : 'none',
                                        userSelect: 'none'
                                    }}
                                >
                                    {isSelected && (
                                        <span style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: 'var(--red)',
                                            color: '#ffffff',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}>✓</span>
                                    )}
                                    {t.toUpperCase()}
                                </div>
                            );
                        })}
                    </div>

                    {txType !== 'Transfer' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.25rem', textAlign: 'center' }}>Account</div>
                                <input
                                    type="text"
                                    value={txAccount || ''}
                                    placeholder="Choose an Account"
                                    readOnly
                                    onClick={() => setSelectingAccountFor('account')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--gray-300)',
                                        background: 'var(--white)',
                                        fontWeight: 700,
                                        color: 'var(--gray-700)',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.25rem', textAlign: 'center' }}>Category</div>
                                <input
                                    type="text"
                                    value={txCategory || ''}
                                    placeholder="Choose a Category"
                                    readOnly
                                    onClick={() => setSelectingCategory(true)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--gray-300)',
                                        background: 'var(--white)',
                                        fontWeight: 700,
                                        color: 'var(--gray-700)',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.25rem', textAlign: 'center' }}>From</div>
                                <input
                                    type="text"
                                    value={txAccount || ''}
                                    placeholder="Choose an Account"
                                    readOnly
                                    onClick={() => setSelectingAccountFor('fromAccount')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--gray-300)',
                                        background: 'var(--white)',
                                        fontWeight: 700,
                                        color: 'var(--gray-700)',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.25rem', textAlign: 'center' }}>To</div>
                                <input
                                    type="text"
                                    value={txCategory || ''}
                                    placeholder="Choose an Account"
                                    readOnly
                                    onClick={() => setSelectingAccountFor('toAccount')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--gray-300)',
                                        background: 'var(--white)',
                                        fontWeight: 700,
                                        color: 'var(--gray-700)',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{
                        border: '1.5px solid var(--gray-300)',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        background: '#FFFDE7',
                        marginBottom: '1.25rem'
                    }}>
                        <textarea
                            value={txDescription}
                            onChange={(e) => setTxDescription(e.target.value)}
                            placeholder="Add notes"
                            style={{
                                width: '100%',
                                height: '60px',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                resize: 'none',
                                fontSize: '0.9rem',
                                color: 'var(--gray-800)',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div style={{
                        border: '1.5px solid var(--gray-300)',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        background: 'var(--white)',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gray-900)', wordBreak: 'break-all' }}>
                                {txCalcExpression}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (txCalcExpression.length <= 1) {
                                        setTxCalcExpression('0');
                                        setTxCalcResult(null);
                                    } else {
                                        setTxCalcExpression(txCalcExpression.slice(0, -1));
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--gray-500)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.25rem'
                                }}
                            >
                                ⌫
                            </button>
                        </div>
                        {txCalcResult !== null && (
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--red)',
                                borderTop: '1px solid var(--gray-200)',
                                paddingTop: '0.5rem',
                                marginTop: '0.5rem',
                                textAlign: 'right'
                            }}>
                                = {txCalcResult}
                            </div>
                        )}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        width: '100%'
                    }}>
                        <button type="button" onClick={() => handleKeypadPress('+')} style={calcKeyStyle('op')}>+</button>
                        <button type="button" onClick={() => handleKeypadPress('7')} style={calcKeyStyle('num')}>7</button>
                        <button type="button" onClick={() => handleKeypadPress('8')} style={calcKeyStyle('num')}>8</button>
                        <button type="button" onClick={() => handleKeypadPress('9')} style={calcKeyStyle('num')}>9</button>
                        <button type="button" onClick={() => handleKeypadPress('-')} style={calcKeyStyle('op')}>-</button>
                        <button type="button" onClick={() => handleKeypadPress('4')} style={calcKeyStyle('num')}>4</button>
                        <button type="button" onClick={() => handleKeypadPress('5')} style={calcKeyStyle('num')}>5</button>
                        <button type="button" onClick={() => handleKeypadPress('6')} style={calcKeyStyle('num')}>6</button>
                        <button type="button" onClick={() => handleKeypadPress('*')} style={calcKeyStyle('op')}>x</button>
                        <button type="button" onClick={() => handleKeypadPress('1')} style={calcKeyStyle('num')}>1</button>
                        <button type="button" onClick={() => handleKeypadPress('2')} style={calcKeyStyle('num')}>2</button>
                        <button type="button" onClick={() => handleKeypadPress('3')} style={calcKeyStyle('num')}>3</button>
                        <button type="button" onClick={() => handleKeypadPress('/')} style={calcKeyStyle('op')}>÷</button>
                        <button type="button" onClick={() => handleKeypadPress('0')} style={calcKeyStyle('num')}>0</button>
                        <button type="button" onClick={() => handleKeypadPress('.')} style={calcKeyStyle('num')}>.</button>
                        <button type="button" onClick={() => handleKeypadPress('=')} style={calcKeyStyle('equals')}>=</button>
                    </div>

                    <div style={{ display: 'flex', width: '100%', borderTop: '1px solid var(--gray-300)', padding: '0.75rem 0 0 0', marginTop: '0.5rem', justifyContent: 'space-between' }}>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="date" 
                                value={txDate} 
                                onChange={(e) => setTxDate(e.target.value)} 
                                style={{ 
                                    border: 'none', 
                                    background: 'transparent', 
                                    fontFamily: 'inherit', 
                                    fontSize: '0.95rem', 
                                    fontWeight: 700, 
                                    color: 'var(--red)',
                                    cursor: 'pointer' 
                                }} 
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="time" 
                                value={txTime} 
                                onChange={(e) => setTxTime(e.target.value)} 
                                style={{ 
                                    border: 'none', 
                                    background: 'transparent', 
                                    fontFamily: 'inherit', 
                                    fontSize: '0.95rem', 
                                    fontWeight: 700, 
                                    color: 'var(--red)',
                                    cursor: 'pointer' 
                                }} 
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal
                title="Select an account"
                open={selectingAccountFor !== null}
                onCancel={() => setSelectingAccountFor(null)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {accounts.map(acc => {
                        const name = acc.name || 'Unnamed Account';
                        const balance = parseFloat(acc.balance) || 0;
                        return (
                            <div key={acc.id}
                                onClick={() => {
                                    if (selectingAccountFor === 'account' || selectingAccountFor === 'fromAccount') {
                                        setTxAccount(name);
                                    } else if (selectingAccountFor === 'toAccount') {
                                        setTxCategory(name);
                                    }
                                    setSelectingAccountFor(null);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--gray-300)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-300)'}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    background: 'var(--gray-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    overflow: 'hidden'
                                }}>
                                    <img src={acc.icon || '/img/accicons/walleticon.png'} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                        Balance: {formatCurrency(balance)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => {
                            setNewAccName('');
                            setNewAccInitial('');
                            setNewAccIcon('/img/accicons/walleticon.png');
                            setCreateAccModalOpen(true);
                        }}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: '2px dashed var(--gray-300)',
                            background: 'transparent',
                            color: 'var(--red)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                        }}
                    >
                        + Create New Account
                    </button>
                </div>
            </Modal>

            <Modal
                title="Select a category"
                open={selectingCategory}
                onCancel={() => setSelectingCategory(false)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {categories.filter(c => {
                        if (txType === 'Transfer') return true;
                        return (c.type || '').toLowerCase().includes(txType.toLowerCase());
                    }).map(cat => {
                        const isIncome = (cat.type || '').toLowerCase().includes('income');
                        return (
                            <div key={cat.id}
                                onClick={() => {
                                    setTxCategory(cat.name);
                                    setSelectingCategory(false);
                                }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--gray-300)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-300)'}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cat.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                        {isIncome ? 'Income' : 'Expense'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => {
                            setNewCatName('');
                            setCreateCatModalOpen(true);
                        }}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: '2px dashed var(--gray-300)',
                            background: 'transparent',
                            color: 'var(--red)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                        }}
                    >
                        + Create New Category
                    </button>
                </div>
            </Modal>

            <Modal
                title="Add Account"
                open={createAccModalOpen}
                onCancel={() => setCreateAccModalOpen(false)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
            >
                <form onSubmit={handleCreateAccSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Account Name"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        required
                        className="form-control"
                    />
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Initial Amount"
                        value={newAccInitial}
                        onChange={(e) => setNewAccInitial(e.target.value)}
                        required
                        className="form-control"
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {ACC_ICONS.map(ico => (
                            <div key={ico.name}
                                onClick={() => setNewAccIcon(ico.src)}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    border: newAccIcon === ico.src ? '3px solid var(--red)' : '1px solid var(--gray-300)',
                                    padding: '4px', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--gray-100)'
                                }}
                            >
                                <img src={ico.src} alt={ico.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setCreateAccModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>Save</button>
                    </div>
                </form>
            </Modal>

            <Modal
                title="Add Category"
                open={createCatModalOpen}
                onCancel={() => setCreateCatModalOpen(false)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
            >
                <form onSubmit={handleCreateCatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Category Name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        required
                        className="form-control"
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setCreateCatModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>Save</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
