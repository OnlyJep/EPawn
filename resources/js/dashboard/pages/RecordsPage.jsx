import React, { useState, useEffect } from 'react';
import { message, Modal } from 'antd';
import ClockPicker from '../components/ClockPicker';
import {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchCategories,
    createCategory,
    fetchAccounts,
    createAccount,
} from '../../services/epawnApi';
import { formatCurrency } from '../../constants/sheetDefaults';

const formatNumberWithCommas = (num) => {
    if (num === null || num === undefined) return '';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

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

const formatFriendlyDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '\u2014';
    try {
        const parts = dateTimeStr.split(' ');
        const datePart = parts[0];
        
        const dateParts = datePart.split('-');
        if (dateParts.length < 3) return dateTimeStr;
        
        const year = parseInt(dateParts[0]);
        const monthIndex = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const month = months[monthIndex];

        return `${month} ${day}, ${year}`;
    } catch (e) {
        return dateTimeStr;
    }
};

const ACC_ICONS = [
    { name: 'Wallet', src: '/img/accicons/walleticon.png' },
    { name: 'Card', src: '/img/accicons/bankcardicon.png' },
    { name: 'Cash', src: '/img/accicons/cashicon.png' },
    { name: 'Coin', src: '/img/accicons/coinicon.png' },
    { name: 'Piggy', src: '/img/accicons/piggyicon.png' }
];

export default function RecordsPage({
    onStatsUpdate,
    onRefreshSheets
}) {
    const [rows, setRows] = useState([]);
    const [budgetTransactions, setBudgetTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [account, setAccount] = useState('');
    const [type, setType] = useState('Expense');
    const [calcExpression, setCalcExpression] = useState('0');
    const [calcResult, setCalcResult] = useState(null);

    const [selectingAccountFor, setSelectingAccountFor] = useState(null);
    const [selectingCategory, setSelectingCategory] = useState(false);

    const [createAccModalOpen, setCreateAccModalOpen] = useState(false);
    const [newAccName, setNewAccName] = useState('');
    const [newAccInitial, setNewAccInitial] = useState('');
    const [newAccIcon, setNewAccIcon] = useState('/img/accicons/walleticon.png');

    const [createCatModalOpen, setCreateCatModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    const [btnHover, setBtnHover] = useState(false);
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeMonth, setActiveMonth] = useState(() => new Date().getMonth());
    const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());
    const [activePeriod, setActivePeriod] = useState('Daily');
    const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
    const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());
    const [pickerDay, setPickerDay] = useState(() => new Date().getDate());
    const [pickerView, setPickerView] = useState('day'); // 'day', 'month', or 'year'

    // Build lookup maps
    const categoryNameToId = {};
    (categories || []).forEach(c => { categoryNameToId[c.name] = c.id; });
    const accountNameToId = {};
    (accounts || []).forEach(a => { accountNameToId[a.name] = a.id; });
    const accountIdToName = {};
    (accounts || []).forEach(a => { accountIdToName[a.id] = a.name; });
    const categoryIdToName = {};
    (categories || []).forEach(c => { categoryIdToName[c.id] = c.name; });

    useEffect(() => {
        if (!modalOpen) return;

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
                setCalcResult(null);
                setCalcExpression(prev => {
                    if (prev.length <= 1) return '0';
                    return prev.slice(0, -1);
                });
            } else if (key.toLowerCase() === 'c' || key === 'Escape') {
                e.preventDefault();
                setCalcExpression('0');
                setCalcResult(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [modalOpen, calcExpression, calcResult]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txRes, catRes, accRes] = await Promise.all([
                fetchTransactions(),
                fetchCategories(),
                fetchAccounts()
            ]);
            setRows(txRes.transactions || []);
            setCategories(catRes.categories || []);
            setAccounts(accRes.accounts || []);

            const savedPlans = localStorage.getItem('budget_plans');
            if (savedPlans) {
                const budgetPlans = JSON.parse(savedPlans);
                const budgetItems = budgetPlans.flatMap(plan => plan.items);
                setBudgetTransactions(budgetItems);
            }
        } catch (error) {
            console.error(error);
            message.error('Failed to load records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const handleBudgetUpdate = () => {
            loadData();
        };
        window.addEventListener('budget_plans_updated', handleBudgetUpdate);
        return () => window.removeEventListener('budget_plans_updated', handleBudgetUpdate);
    }, []);

    const openCreateModal = () => {
        setEditingRow(null);
        setDate(new Date().toISOString().split('T')[0]);
        
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hrs}:${mins}`);

        setDescription('');
        
        const expCats = categories.filter(c => (c.type || '').toLowerCase().includes('expense'));
        setCategory(expCats[0]?.name || 'General');
        setAccount(accounts[0]?.name || 'Cash');
        
        setCalcExpression('0');
        setType('Expense');
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingRow(row);

        const dateStr = row.date || '';
        // Handle ISO format dates (2026-07-01T00:00:00.000000Z)
        const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
        const parts = dateOnly.split(' ');
        setDate(parts[0] || new Date().toISOString().split('T')[0]);

        const now = new Date();
        const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setTime(parts[1] || defaultTime);

        setDescription(row.description || '');
        setCategory(row.category?.name || 'General');
        setAccount(row.account?.name || (row.account ? accountIdToName[row.account] : 'Cash') || 'Cash');
        setCalcExpression(String(row.amount || '0'));
        setType(row.type === 'income' ? 'Income' : row.type === 'expense' ? 'Expense' : 'Transfer');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let amtVal = evaluateExpr(calcExpression);
        if (amtVal === null) {
            amtVal = parseFloat(calcExpression) || 0;
        }

        if (amtVal <= 0) {
            message.error('Please enter a valid amount greater than 0.');
            return;
        }

        if (!date) {
            message.error('Please select a date.');
            return;
        }

        if (!account || account === 'Choose an Account') {
            message.error('Please select an account.');
            return;
        }

        if (!category || category === 'Choose a Category' || category === 'Choose an Account') {
            message.error('Please select a category.');
            return;
        }

        const combinedDate = time ? `${date} ${time}` : date;

        // Ensure date is in yyyy-MM-dd format (not ISO format)
        const formattedDate = date.includes('T') ? date.split('T')[0] : date;
        const finalDate = time ? `${formattedDate} ${time}` : formattedDate;

        const payload = {
            account_id: accountNameToId[account] || null,
            category_id: categoryNameToId[category] || null,
            type: type.toLowerCase(),
            amount: amtVal,
            description,
            date: finalDate,
        };

        try {
            if (!editingRow) {
                message.error('Creating new records is not allowed. Please use the Budget page to add transactions.');
                return;
            }
            await updateTransaction(editingRow.id, payload);
            message.success('Record saved.');
            setModalOpen(false);
            loadData();
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            message.error('Failed to save record.');
        }
    };

    const handleDelete = async (rowId) => {
        Modal.confirm({
            title: 'Delete Record',
            content: 'Are you sure you want to delete this record?',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteTransaction(rowId);
                    message.success('Record deleted.');
                    loadData();
                    if (onRefreshSheets) onRefreshSheets();
                } catch (error) {
                    console.error('Delete record error:', error);
                    message.error(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`);
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
                setAccount(newAccName);
            } else if (selectingAccountFor === 'toAccount') {
                setCategory(newAccName);
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
            type: type.toLowerCase()
        };

        try {
            await createCategory(payload);
            message.success('Category added.');
            await loadData();
            
            setCategory(newCatName);
            setCreateCatModalOpen(false);
            setSelectingCategory(false);
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            message.error('Failed to save category.');
        }
    };

    const handleKeypadPress = (key) => {
        if (key === '=') {
            const evaluated = evaluateExpr(calcExpression);
            if (evaluated !== null) {
                setCalcResult(evaluated);
                setCalcExpression(String(evaluated));
            } else {
                message.error('Invalid expression.');
            }
            return;
        }

        setCalcResult(null);
        const isOperator = ['+', '-', '*', '/'].includes(key);

        if (isOperator) {
            const displayOp = key === '*' ? ' x ' : key === '/' ? ' \u00f7 ' : ` ${key} `;
            const trimmed = calcExpression.trimEnd();
            const lastChar = trimmed.slice(-1);
            if (['+', '-', 'x', '\u00f7', '*', '/'].includes(lastChar)) {
                setCalcExpression(trimmed.slice(0, -1).trimEnd() + displayOp);
                return;
            }
            const evaluated = evaluateExpr(calcExpression);
            if (evaluated !== null) {
                setCalcExpression(String(evaluated) + displayOp);
            } else {
                setCalcExpression(prev => prev + displayOp);
            }
            return;
        }

        let char = key === '*' ? 'x' : key === '/' ? '\u00f7' : key;
        const trimmed = calcExpression.trimEnd();
        const tokens = trimmed.split(/\s+/);
        const lastToken = tokens[tokens.length - 1] || '';
        const lastChar = trimmed.slice(-1);
        const endsWithOp = ['+', '-', 'x', '\u00f7', '*', '/'].includes(lastChar);

        if (endsWithOp) {
            setCalcExpression(prev => prev + (key === '.' ? '0.' : char));
            return;
        }

        if (lastToken === '0' && key === '0') return;

        if (lastToken === '0' && key !== '.' && calcExpression !== '0') {
            setCalcExpression(trimmed.slice(0, -1) + char);
            return;
        }

        if (calcExpression === '0' && key !== '.') {
            setCalcExpression(char);
            return;
        }

        setCalcExpression(prev => prev + char);
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

    const handleMenuClick = (key, row) => {
        if (key === 'edit') {
            openEditModal(row);
        } else if (key === 'delete') {
            handleDelete(row.id);
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(activeMonth, activeYear);

    const filteredRows = rows.filter(row => {
        if (activeFilter !== 'All') {
            const rType = (row.type || '').toLowerCase();
            if (rType !== activeFilter.toLowerCase()) return false;
        }

        const dateStr = row.date || '';
        if (!dateStr) return false;

        try {
            const datePart = dateStr.split(' ')[0];
            const dateParts = datePart.split('-');
            if (dateParts.length < 3) return false;

            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const day = parseInt(dateParts[2]);

            if (month !== activeMonth || year !== activeYear) return false;

            if (activePeriod === 'Daily') {
                // Filter by specific day if selectedDay is set
                if (selectedDay && day !== selectedDay) return false;
                return true;
            }
            if (activePeriod === '1st-15th') return day >= 1 && day <= 15;
            if (activePeriod === '16th-End') return day >= 16;
            if (activePeriod === 'Weekly') return true;
        } catch (e) {
            return false;
        }

        return true;
    });

    const filteredBudgetTransactions = budgetTransactions.filter(item => {
        if (activeFilter !== 'All') {
            const iType = (item.type || '').toLowerCase();
            if (iType !== activeFilter.toLowerCase()) return false;
        }
        return true;
    });

    const allCombinedTransactions = [
        ...filteredRows.map(row => ({
            id: row.id,
            date: row.date,
            description: row.description || 'No description',
            type: row.type === 'income' ? 'Income' : row.type === 'expense' ? 'Expense' : 'Transfer',
            category: row.category?.name || 'General',
            account: row.account,
            to_account: row.to_account,
            is_source: row.is_source,
            amount: parseFloat(row.amount) || 0,
            isBudget: false
        }))
    ];

    const sortedRows = [...allCombinedTransactions].sort((a, b) => {
        const dateA = a.date ? new Date(a.date.replace(/-/g, '/')) : new Date(0);
        const dateB = b.date ? new Date(b.date.replace(/-/g, '/')) : new Date(0);
        return dateB - dateA;
    });

    const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
    const paginatedRows = sortedRows.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, activeMonth, activeYear, activePeriod, selectedDay]);

    return (
        <div className="records-page" style={{ padding: '2rem', background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--gray-300)', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--red)', fontWeight: 700, margin: 0 }}>Transaction Records</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>View and manage your income, expenses, and transfers.</p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                <button
                    type="button"
                    onClick={() => {
                        const newDate = new Date(activeYear, activeMonth, selectedDay);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setActiveYear(newDate.getFullYear());
                        setActiveMonth(newDate.getMonth());
                        setSelectedDay(newDate.getDate());
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    &lsaquo;
                </button>
                <span 
                    style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gray-800)', cursor: 'pointer' }}
                    onClick={() => setDatePickerOpen(true)}
                >
                    {selectedDay ? `${selectedDay}, ${months[activeMonth]} ${activeYear}` : `${months[activeMonth]} ${activeYear}`}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        const newDate = new Date(activeYear, activeMonth, selectedDay);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setActiveYear(newDate.getFullYear());
                        setActiveMonth(newDate.getMonth());
                        setSelectedDay(newDate.getDate());
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    &rsaquo;
                </button>
            </div>

            <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '0.25rem',
                borderBottom: '2px solid var(--gray-200)',
                paddingBottom: '0.5rem',
                marginBottom: '1.25rem',
                scrollbarWidth: 'none'
            }}>
                {months.map((m, index) => {
                    const isActive = activeMonth === index;
                    return (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setActiveMonth(index)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                background: 'transparent',
                                color: isActive ? 'var(--red)' : 'var(--gray-500)',
                                fontWeight: isActive ? 800 : 600,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                borderBottom: isActive ? '3px solid var(--red)' : 'none',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {m}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)', marginRight: '0.5rem' }}>View Block:</span>
                {['Daily', '1st-15th', '16th-End', 'Weekly'].map(period => {
                    const isActive = activePeriod === period;
                    return (
                        <button
                            key={period}
                            type="button"
                            onClick={() => setActivePeriod(period)}
                            style={{
                                padding: '0.35rem 1rem',
                                borderRadius: '20px',
                                border: isActive ? '1.5px solid var(--red)' : '1.5px solid var(--gray-300)',
                                background: isActive ? 'var(--red)' : 'transparent',
                                color: isActive ? '#ffffff' : 'var(--gray-700)',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase'
                            }}
                        >
                            {period}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)', marginRight: '0.5rem' }}>Filter by Type:</span>
                
                <div style={{ display: 'flex', gap: '0.5rem' }} className="desktop-filters">
                    {['All', 'Income', 'Expense', 'Transfer'].map(filterOpt => {
                        const isActive = activeFilter === filterOpt;
                        return (
                            <button
                                key={filterOpt}
                                type="button"
                                onClick={() => setActiveFilter(filterOpt)}
                                style={{
                                    padding: '0.35rem 1.25rem',
                                    borderRadius: '20px',
                                    border: isActive ? '1.5px solid var(--red)' : '1.5px solid var(--gray-300)',
                                    background: isActive ? 'var(--red)' : 'transparent',
                                    color: isActive ? '#ffffff' : 'var(--gray-700)',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {filterOpt}
                            </button>
                        );
                    })}
                </div>

                <div style={{ position: 'relative', display: 'none' }} className="mobile-filter-dropdown">
                    <button
                        type="button"
                        onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1.5px solid var(--gray-300)',
                            background: 'var(--white)',
                            color: 'var(--gray-700)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {activeFilter}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                    {filterDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '0.5rem',
                            background: 'var(--white)',
                            border: '1.5px solid var(--gray-300)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 10,
                            minWidth: '120px'
                        }}>
                            {['All', 'Income', 'Expense', 'Transfer'].map(filterOpt => (
                                <button
                                    key={filterOpt}
                                    type="button"
                                    onClick={() => {
                                        setActiveFilter(filterOpt);
                                        setFilterDropdownOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        background: activeFilter === filterOpt ? 'var(--red-light)' : 'transparent',
                                        color: activeFilter === filterOpt ? 'var(--red)' : 'var(--gray-700)',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.2s ease'
                                    }}
                                >
                                    {filterOpt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <p>Loading transactions...</p>
            ) : sortedRows.length === 0 ? (
                <p style={{ color: 'var(--gray-500)' }}>No matching records found.</p>
            ) : (
                <>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                Page {currentPage} of {totalPages} ({sortedRows.length} total)
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
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        border: '1.5px solid var(--gray-300)',
                                        background: currentPage === totalPages ? 'var(--gray-100)' : 'var(--white)',
                                        color: currentPage === totalPages ? 'var(--gray-400)' : 'var(--gray-700)',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                    <th style={{ padding: '0.75rem 1rem', width: '90px' }}>Actions</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Notes</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Details</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row) => {
                                const isExpense = (row.type || '').toLowerCase().includes('expense');
                                const isTransfer = (row.type || '').toLowerCase().includes('transfer');
                                const isTransferSource = isTransfer && (row.is_source === true || row.is_source === 1 || row.is_source === '1');
                                const isTransferDest = isTransfer && (row.is_source === false || row.is_source === 0 || row.is_source === '0');
                                return (
                                    <tr key={row.id} style={{ borderBottom: '1px solid var(--gray-200)', opacity: row.isBudget ? 0.8 : 1 }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {row.isBudget ? (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>Budget Plan</span>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                                    <button
                                                        type="button"
                                                        title="Edit"
                                                        onClick={() => {
                                                            const originalRow = rows.find(r => r.id === row.id);
                                                            if (originalRow) openEditModal(originalRow);
                                                            else openEditModal({ id: row.id, date: row.date, description: row.description, type: row.type.toLowerCase(), category: { name: row.category }, account: { name: row.account }, amount: row.amount });
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '0.35rem',
                                                            borderRadius: '6px',
                                                            color: 'var(--gray-500)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'color 0.2s, background 0.2s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-light)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray-500)'; e.currentTarget.style.background = 'none'; }}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        onClick={() => handleDelete(row.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '0.35rem',
                                                            borderRadius: '6px',
                                                            color: 'var(--gray-500)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'color 0.2s, background 0.2s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#FEE2E2'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray-500)'; e.currentTarget.style.background = 'none'; }}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"/>
                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                            <path d="M10 11v6M14 11v6"/>
                                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                            {formatFriendlyDateTime(row.date)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>{row.description}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: isTransfer ? 'var(--red-glow)' : (isExpense ? 'var(--red-light)' : 'var(--gray-100)'),
                                                color: isTransfer ? 'var(--red-dark)' : (isExpense ? 'var(--red)' : 'var(--gray-700)'),
                                                textTransform: 'uppercase'
                                            }}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                        {isTransfer ? (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                                                {isTransferSource ? (
                                                    <span style={{ color: 'var(--red)' }}>Transferred to <strong>{row.to_account?.name || 'another account'}</strong></span>
                                                ) : (
                                                    <span style={{ color: 'var(--green, #10b981)' }}>Transferred from <strong>{row.to_account?.name || 'another account'}</strong></span>
                                                )}
                                            </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'var(--gray-100)', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                                                        {row.category?.name || row.category}
                                                    </span>
                                                    <span style={{ color: 'var(--gray-400)' }}>in</span>
                                                    <strong style={{ color: 'var(--gray-700)', fontSize: '0.85rem' }}>{row.account?.name || row.account}</strong>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: isTransferSource ? 'var(--red)' : (isTransferDest ? 'var(--green, #10b981)' : (isExpense ? 'var(--red)' : 'var(--gray-900)')) }}>
                                            {isTransferSource ? '-' : (isTransferDest ? '+' : (isExpense ? '-' : '+'))}{formatCurrency(row.amount)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                </>
            )}

            <Modal
                classNames={{ wrapper: 'tx-modal-wrap', body: 'tx-modal-body' }}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                closable={false}
                styles={{ body: { padding: '1.25rem' } }}
            >
                <form id="transaction-form" onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <button 
                            type="button" 
                            onClick={() => setModalOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            ✕ CANCEL
                        </button>
                        <button 
                            type="submit" 
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            SAVE
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
                            const isSelected = type === t;
                            return (
                                <div
                                    key={t}
                                    onClick={() => {
                                        setType(t);
                                        if (t === 'Transfer') {
                                            setCategory('Transfer');
                                        } else {
                                            const matchingCats = categories.filter(c => (c.type || '').toLowerCase().includes(t.toLowerCase()));
                                            setCategory(matchingCats[0]?.name || 'General');
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
                                    {t.toUpperCase()}
                                </div>
                            );
                        })}
                    </div>

                    {type !== 'Transfer' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.25rem', textAlign: 'center' }}>Account</div>
                                <input
                                    type="text"
                                    value={account || ''}
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
                                    value={category || ''}
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
                                    value={account || ''}
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
                                    value={category || ''}
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
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                                {formatNumberWithCommas(calcExpression)}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (calcExpression.length <= 1) {
                                        setCalcExpression('0');
                                    } else {
                                        setCalcExpression(calcExpression.slice(0, -1));
                                    }
                                    setCalcResult(null);
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
                        {calcResult !== null && (
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--red)',
                                borderTop: '1px solid var(--gray-200)',
                                paddingTop: '0.5rem',
                                marginTop: '0.5rem',
                                textAlign: 'right'
                            }}>
                                = {formatNumberWithCommas(calcResult)}
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
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
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
                            <ClockPicker 
                                value={time} 
                                onChange={setTime}
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
                classNames={{ wrapper: 'tx-select-wrap' }}
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
                                        setAccount(name);
                                    } else if (selectingAccountFor === 'toAccount') {
                                        setCategory(name);
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
                classNames={{ wrapper: 'tx-select-wrap' }}
                title="Select a category"
                open={selectingCategory}
                onCancel={() => setSelectingCategory(false)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {categories.filter(c => {
                        if (type === 'Transfer') return true;
                        return (c.type || '').toLowerCase().includes(type.toLowerCase());
                    }).map(cat => {
                        const isIncome = (cat.type || '').toLowerCase().includes('income');
                        return (
                            <div key={cat.id}
                                onClick={() => {
                                    setCategory(cat.name);
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
                title="Select Date"
                open={datePickerOpen}
                onCancel={() => setDatePickerOpen(false)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
                classNames={{ wrapper: 'add-category-modal', header: 'add-category-header', body: 'add-category-body' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => {
                                if (pickerView === 'day') {
                                    const newDate = new Date(pickerYear, pickerMonth - 1, 1);
                                    setPickerYear(newDate.getFullYear());
                                    setPickerMonth(newDate.getMonth());
                                } else if (pickerView === 'month') {
                                    setPickerYear(pickerYear - 1);
                                } else if (pickerView === 'year') {
                                    setPickerYear(pickerYear - 12);
                                }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            &lsaquo;
                        </button>
                        <span 
                            style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-800)', cursor: 'pointer' }}
                            onClick={() => {
                                if (pickerView === 'day') setPickerView('month');
                                else if (pickerView === 'month') setPickerView('year');
                            }}
                        >
                            {pickerView === 'day' ? `${months[pickerMonth]} ${pickerYear}` : pickerView === 'month' ? pickerYear : `${Math.floor(pickerYear / 10) * 10}s`}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                if (pickerView === 'day') {
                                    const newDate = new Date(pickerYear, pickerMonth + 1, 1);
                                    setPickerYear(newDate.getFullYear());
                                    setPickerMonth(newDate.getMonth());
                                } else if (pickerView === 'month') {
                                    setPickerYear(pickerYear + 1);
                                } else if (pickerView === 'year') {
                                    setPickerYear(pickerYear + 12);
                                }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            &rsaquo;
                        </button>
                    </div>
                    
                    {pickerView === 'day' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)', padding: '0.25rem' }}>{day}</div>
                            ))}
                            {Array.from({ length: new Date(pickerYear, pickerMonth, 0).getDay() }, (_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: new Date(pickerYear, pickerMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                                const isSelected = day === pickerDay;
                                const isToday = day === new Date().getDate() && pickerMonth === new Date().getMonth() && pickerYear === new Date().getFullYear();
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => setPickerDay(day)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid var(--red)' : '1px solid var(--gray-300)',
                                            background: isSelected ? 'var(--red)' : isToday ? 'var(--red-light)' : 'var(--white)',
                                            color: isSelected ? '#ffffff' : 'var(--gray-700)',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    {pickerView === 'month' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {months.map((month, index) => {
                                const isSelected = index === pickerMonth;
                                return (
                                    <button
                                        key={month}
                                        type="button"
                                        onClick={() => {
                                            setPickerMonth(index);
                                            setPickerView('day');
                                        }}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid var(--red)' : '1px solid var(--gray-300)',
                                            background: isSelected ? 'var(--red)' : 'var(--white)',
                                            color: isSelected ? '#ffffff' : 'var(--gray-700)',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {month}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    {pickerView === 'year' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {Array.from({ length: 12 }, (_, i) => {
                                const year = Math.floor(pickerYear / 10) * 10 + i;
                                const isSelected = year === pickerYear;
                                return (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => {
                                            setPickerYear(year);
                                            setPickerView('month');
                                        }}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid var(--red)' : '1px solid var(--gray-300)',
                                            background: isSelected ? 'var(--red)' : 'var(--white)',
                                            color: isSelected ? '#ffffff' : 'var(--gray-700)',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {year}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    <div style={{ padding: '0.75rem', background: 'var(--gray-100)', borderRadius: '8px', textAlign: 'center', fontWeight: 700, color: 'var(--red)' }}>
                        {pickerDay}, {months[pickerMonth]} {pickerYear}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={() => {
                                setDatePickerOpen(false);
                                setPickerView('day');
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
                            onClick={() => {
                                setActiveYear(pickerYear);
                                setActiveMonth(pickerMonth);
                                setSelectedDay(pickerDay);
                                setDatePickerOpen(false);
                                setPickerView('day');
                            }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                classNames={{ wrapper: 'add-account-modal', header: 'add-account-header', body: 'add-account-body' }}
                title="Add Account"
                open={createAccModalOpen}
                onCancel={() => setCreateAccModalOpen(false)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
            >
                <form className="account-form" onSubmit={handleCreateAccSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                classNames={{ wrapper: 'add-category-modal', header: 'add-category-header', body: 'add-category-body' }}
                title="Add Category"
                open={createCatModalOpen}
                onCancel={() => setCreateCatModalOpen(false)}
                footer={null}
                styles={{ body: { padding: '1rem' } }}
            >
                <form className="category-form" onSubmit={handleCreateCatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
