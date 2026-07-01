import React, { useState, useEffect } from 'react';
import { message, Modal, Dropdown, Select } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccountApi,
    fetchTransactions
} from '../../services/epawnApi';
import { formatCurrency } from '../../constants/sheetDefaults';

const ACC_ICONS = [
    { name: 'Wallet', src: '/img/accicons/walleticon.png' },
    { name: 'Card', src: '/img/accicons/bankcardicon.png' },
    { name: 'Cash', src: '/img/accicons/cashicon.png' },
    { name: 'Coin', src: '/img/accicons/coinicon.png' },
    { name: 'Piggy', src: '/img/accicons/piggyicon.png' }
];

export default function AccountsPage({
    onStatsUpdate,
    onRefreshSheets
}) {
    const [rows, setRows] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    // Summary states
    const [expenseSoFar, setExpenseSoFar] = useState(0);
    const [incomeSoFar, setIncomeSoFar] = useState(0);
    const [totalBalance, setTotalBalance] = useState(0);

    // Account details view states
    const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountTransactions, setAccountTransactions] = useState([]);
    const [sortOrder, setSortOrder] = useState('newToOld');

    // Pagination state for accounts list
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    // Form states
    const [accountName, setAccountName] = useState('');
    const [initialAmount, setInitialAmount] = useState('');
    const [balance, setBalance] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('/img/accicons/walleticon.png');
    const [btnHover, setBtnHover] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [accRes, txRes] = await Promise.all([
                fetchAccounts(),
                fetchTransactions()
            ]);
            const accRows = accRes.accounts || [];
            setRows(accRows);
            setAllTransactions(txRes.transactions || []);

            let bal = 0;
            accRows.forEach(acc => {
                bal += parseFloat(acc.balance) || 0;
            });
            setTotalBalance(bal);

            let exp = 0;
            let inc = 0;
            (txRes.transactions || []).forEach(tx => {
                const type = (tx.type || '').toLowerCase();
                const amt = parseFloat(tx.amount) || 0;
                if (type.includes('expense')) {
                    exp += amt;
                } else if (type.includes('income')) {
                    inc += amt;
                }
            });
            setExpenseSoFar(exp);
            setIncomeSoFar(inc);
        } catch (error) {
            console.error('Load accounts error:', error);
            message.error(`Failed to load accounts: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openCreateModal = () => {
        setEditingRow(null);
        setAccountName('');
        setInitialAmount('');
        setBalance('');
        setSelectedIcon(ACC_ICONS[0].src);
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingRow(row);
        setAccountName(row.name || '');
        setInitialAmount(row.initial_balance !== undefined ? String(row.initial_balance) : '');
        setBalance(row.balance !== undefined ? String(row.balance) : '');
        setSelectedIcon(row.icon || ACC_ICONS[0].src);
        setModalOpen(true);
    };

    const openAccountDetails = async (row) => {
        setSelectedAccount(row);
        setAccountDetailsOpen(true);
        
        const transactions = allTransactions.filter(tx => tx.account_id === row.id);
        setAccountTransactions(transactions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accountName || initialAmount === '') {
            message.error('Please fill in all required fields.');
            return;
        }

        const amtVal = parseFloat(initialAmount);

        const payload = {
            name: accountName,
            initial_balance: amtVal,
            icon: selectedIcon
        };

        try {
            if (editingRow) {
                await updateAccount(editingRow.id, payload);
                message.success('Account updated successfully.');
            } else {
                await createAccount(payload);
                message.success('Account added successfully.');
            }
            setModalOpen(false);
            loadData();
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            console.error('Save account error:', error);
            message.error(`Failed to save account: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (rowId) => {
        Modal.confirm({
            title: 'Delete Account',
            content: 'Are you sure you want to delete this account? All transactions connected to this account will also be deleted.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const accountToDelete = rows.find(r => r.id === rowId);
                    const transactionsToDelete = allTransactions.filter(tx => tx.account_id === rowId);
                    const count = transactionsToDelete.length;

                    await deleteAccountApi(rowId);

                    loadData();
                    if (onStatsUpdate) {
                        onStatsUpdate({ 
                            totalSaved: totalBalance,
                            incomeLogged: incomeSoFar,
                            activeLoans: expenseSoFar
                        });
                    }
                    if (onRefreshSheets) onRefreshSheets();
                    message.success(`Account and ${count} connected transaction(s) deleted.`);
                } catch (error) {
                    console.error('Delete account error:', error);
                    message.error(`Failed to delete account: ${error.response?.data?.message || error.message || 'Unknown error'}`);
                }
            }
        });
    };

    const handleMenuClick = (key, row) => {
        if (key === 'edit') {
            openEditModal(row);
        } else if (key === 'delete') {
            handleDelete(row.id);
        }
    };

    return (
        <div className="accounts-page" style={{ padding: '2rem', background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--gray-300)', position: 'relative' }}>
            
            {/* Floating Add Account Button for Mobile */}
            <button
                type="button"
                onClick={openCreateModal}
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
            
            {/* Overall Summary section */}
            <h2 style={{ fontSize: '1.25rem', color: 'var(--red)', fontWeight: 700, marginBottom: '0.75rem' }}>Overall</h2>
            <div style={{
                background: 'var(--red-light)',
                border: '1.5px solid #FFCDD2',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1.5px solid #FFCDD2', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ textAlign: 'center', borderRight: '1.5px solid #FFCDD2' }}>
                        <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Expense So Far</div>
                        <div style={{ color: 'var(--red)', fontSize: '1.25rem', fontWeight: 800 }}>
                            -{formatCurrency(expenseSoFar)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Income So Far</div>
                        <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 800 }}>
                            +{formatCurrency(incomeSoFar)}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Balance</div>
                    <div style={{ color: 'var(--gray-900)', fontSize: '1.65rem', fontWeight: 900 }}>
                        {formatCurrency(totalBalance)}
                    </div>
                </div>
            </div>

            {/* Accounts Header & Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--red)', fontWeight: 700, margin: 0 }}>Accounts</h2>
                <div className="desktop-create-btn">
                    <button
                        type="button"
                        style={{
                            borderRadius: '12px',
                            border: '2px solid var(--red)',
                            color: btnHover ? '#ffffff' : 'var(--red)',
                            background: btnHover ? 'var(--red)' : 'transparent',
                            fontWeight: 700,
                            padding: '0.5rem 1.5rem',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                        }}
                        onMouseEnter={() => setBtnHover(true)}
                        onMouseLeave={() => setBtnHover(false)}
                        onClick={openCreateModal}
                    >
                        + ADD NEW ACCOUNT
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Loading accounts...</p>
            ) : rows.length === 0 ? (
                <p style={{ color: 'var(--gray-500)' }}>No accounts created yet.</p>
            ) : (
                <>
                    {/* Pagination Controls */}
                    {Math.ceil(rows.length / rowsPerPage) > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                Page {currentPage} of {Math.ceil(rows.length / rowsPerPage)} ({rows.length} total)
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--gray-300)',
                                        background: currentPage === 1 ? 'var(--gray-100)' : 'var(--white)',
                                        color: currentPage === 1 ? 'var(--gray-400)' : 'var(--gray-700)',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(rows.length / rowsPerPage), prev + 1))}
                                    disabled={currentPage === Math.ceil(rows.length / rowsPerPage)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--gray-300)',
                                        background: currentPage === Math.ceil(rows.length / rowsPerPage) ? 'var(--gray-100)' : 'var(--white)',
                                        color: currentPage === Math.ceil(rows.length / rowsPerPage) ? 'var(--gray-400)' : 'var(--gray-700)',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: currentPage === Math.ceil(rows.length / rowsPerPage) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((row) => {
                        const iconUrl = row.icon || '/img/accicons/walleticon.png';
                        const accName = row.name || 'Unnamed Account';
                        const balAmt = parseFloat(row.balance) || 0;

                        return (
                            <div 
                                key={row.id} 
                                className="account-card"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1.25rem',
                                    borderRadius: '16px',
                                    border: '1.5px solid var(--gray-300)',
                                    background: 'var(--white)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => openAccountDetails(row)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {/* Icon Frame */}
                                    <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '12px',
                                        background: 'var(--red-light)',
                                        border: '1px solid #FFCDD2',
                                        padding: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        <img src={iconUrl} alt="account icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    {/* Account Details */}
                                    <div>
                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.25rem', marginTop: 0 }}>{accName}</h3>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>
                                            Balance: <strong style={{ color: 'var(--red)' }}>{formatCurrency(balAmt)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* 3-dot Actions Dropdown */}
                                <Dropdown
                                    trigger={['click']}
                                    menu={{
                                        items: [
                                            {
                                                key: 'edit',
                                                label: (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                                                        <EditOutlined /> Edit
                                                    </span>
                                                ),
                                            },
                                            {
                                                key: 'delete',
                                                label: (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#ef4444' }}>
                                                        <DeleteOutlined /> Delete
                                                    </span>
                                                ),
                                            },
                                        ],
                                        onClick: ({ key, domEvent }) => {
                                            domEvent.stopPropagation();
                                            if (key === 'edit') {
                                                openEditModal(row);
                                            } else if (key === 'delete') {
                                                handleDelete(row.id);
                                            }
                                        },
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '1.4rem',
                                            cursor: 'pointer',
                                            padding: '0.4rem 0.5rem',
                                            lineHeight: 1,
                                            color: 'var(--gray-500)',
                                            transition: 'color 0.2s, background 0.2s',
                                            minWidth: '36px',
                                            minHeight: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '8px',
                                            letterSpacing: '-1px',
                                            touchAction: 'manipulation',
                                        }}
                                        title="Actions"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'var(--gray-900)';
                                            e.currentTarget.style.background = 'var(--gray-100)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--gray-500)';
                                            e.currentTarget.style.background = 'none';
                                        }}
                                    >
                                        ⋮
                                    </button>
                                </Dropdown>
                            </div>
                        );
                    })}
                </div>
                </>
            )}

            {/* Account Details Modal */}
            <Modal
                title={selectedAccount?.name || 'Account Details'}
                open={accountDetailsOpen}
                onCancel={() => setAccountDetailsOpen(false)}
                footer={null}
                styles={{ body: { padding: '1.5rem' } }}
                width={700}
            >
                {selectedAccount && (
                    <div>
                        {/* Account Info */}
                        <div style={{
                            background: 'var(--red-light)',
                            border: '1.5px solid #FFCDD2',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <img 
                                    src={selectedAccount.icon || '/img/accicons/walleticon.png'} 
                                    alt="account icon" 
                                    style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                                />
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
                                        {selectedAccount.name}
                                    </h3>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>
                                        Balance: <strong style={{ color: 'var(--red)' }}>{formatCurrency(selectedAccount.balance || 0)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sort Filter */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-700)', margin: 0 }}>
                                Transactions ({accountTransactions.length})
                            </h4>
                            <Select
                                value={sortOrder}
                                onChange={(val) => setSortOrder(val)}
                                size="small"
                                style={{ width: 130 }}
                                options={[
                                    { value: 'newToOld', label: '↓ New to Old' },
                                    { value: 'oldToNew', label: '↑ Old to New' },
                                ]}
                            />
                        </div>

                        {/* Transaction List */}
                        {accountTransactions.length === 0 ? (
                            <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '2rem' }}>
                                No transactions found for this account.
                            </p>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {(() => {
                                    const sortedTransactions = [...accountTransactions].sort((a, b) => {
                                        const dateA = a.date ? new Date(a.date.replace(/-/g, '/')) : new Date(0);
                                        const dateB = b.date ? new Date(b.date.replace(/-/g, '/')) : new Date(0);
                                        return sortOrder === 'newToOld' ? dateB - dateA : dateA - dateB;
                                    });

                                    const groupedByMonth = sortedTransactions.reduce((groups, tx) => {
                                        const date = tx.date ? new Date(tx.date.replace(/-/g, '/')) : new Date(0);
                                        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                                        if (!groups[monthKey]) {
                                            groups[monthKey] = [];
                                        }
                                        groups[monthKey].push(tx);
                                        return groups;
                                    }, {});

                                    const monthNames = sortOrder === 'newToOld' 
                                        ? Object.keys(groupedByMonth).reverse() 
                                        : Object.keys(groupedByMonth);

                                    return monthNames.map(monthKey => (
                                        <div key={monthKey} style={{ marginBottom: '1.5rem' }}>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 800,
                                                color: 'var(--red)',
                                                marginBottom: '0.75rem',
                                                paddingBottom: '0.5rem',
                                                borderBottom: '2px solid var(--red-light)'
                                            }}>
                                                {monthKey}
                                            </div>
                                            
                                            {groupedByMonth[monthKey].map((tx) => {
                                                const date = tx.date ? new Date(tx.date.replace(/-/g, '/')) : new Date(0);
                                                const day = date.getDate();
                                                const isExpense = (tx.type || '').toLowerCase().includes('expense');
                                                const isTransfer = (tx.type || '').toLowerCase().includes('transfer');
                                                return (
                                                    <div key={tx.id} style={{
                                                        padding: '0.75rem 0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem'
                                                    }}>
                                                        <div style={{
                                                            width: '40px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 700,
                                                            color: 'var(--gray-500)',
                                                            textAlign: 'center'
                                                        }}>
                                                            {day}
                                                        </div>
                                                        
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                                                                {tx.description || 'No description'}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                                {tx.category?.name || 'General'}
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{
                                                            fontWeight: 800,
                                                            color: isTransfer ? 'var(--gray-900)' : (isExpense ? 'var(--red)' : 'var(--gray-900)')
                                                        }}>
                                                            {isTransfer ? '' : (isExpense ? '-' : '+')}{formatCurrency(tx.amount || 0)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Form */}
            <Modal
                title={editingRow ? 'Edit Account' : 'Add Account'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                styles={{ body: { padding: '1.5rem' } }}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Initial Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={initialAmount}
                            onChange={(e) => setInitialAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontSize: '1rem',
                                border: '1.5px solid var(--gray-300)',
                                borderRadius: '10px',
                                outline: 'none',
                                background: 'var(--white)',
                                color: 'var(--gray-900)',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--red)'}
                            onBlur={e => e.target.style.borderColor = 'var(--gray-300)'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Account Name</label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="e.g. Cash, GCash, BDO"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontSize: '1rem',
                                border: '1.5px solid var(--gray-300)',
                                borderRadius: '10px',
                                outline: 'none',
                                background: 'var(--white)',
                                color: 'var(--gray-900)',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--red)'}
                            onBlur={e => e.target.style.borderColor = 'var(--gray-300)'}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>Choose Icon :</label>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                            {ACC_ICONS.map((iconOption) => {
                                const isSelected = selectedIcon === iconOption.src;
                                return (
                                    <div
                                        key={iconOption.name}
                                        onClick={() => setSelectedIcon(iconOption.src)}
                                        style={{
                                            position: 'relative',
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '50%',
                                            border: isSelected ? '3px solid var(--red)' : '1px solid var(--gray-300)',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--gray-100)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <img
                                            src={iconOption.src}
                                            alt={iconOption.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-2px',
                                                right: '-2px',
                                                background: 'var(--red)',
                                                color: '#ffffff',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                border: '1px solid var(--white)'
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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
        </div>
    );
}
