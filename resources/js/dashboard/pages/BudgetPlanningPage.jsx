import React, { useState, useEffect } from 'react';
import { message, Modal } from 'antd';
import { EditOutlined, InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchBudgetPlans, createBudgetPlan, updateBudgetPlan, deleteBudgetPlan, createBudgetPlanItem, updateBudgetPlanItem, deleteBudgetPlanItem, fetchCategories, createCategory } from '../../services/epawnApi';
import { formatCurrency } from '../../constants/sheetDefaults';

const evaluateExpr = (expr) => {
    try {
        const sanitized = expr.replace(/x/g, '*').replace(/\u00F7/g, '/');
        if (/^[0-9.+\-*/\s()]+$/.test(sanitized)) {
            return Number((eval(sanitized)).toFixed(2));
        }
    } catch (e) { /* ignore */ }
    return null;
};

const formatFriendlyDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '\u2014';
    try {
        const d = new Date(dateTimeStr);
        if (isNaN(d.getTime())) return dateTimeStr;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let h = d.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h}:${String(d.getMinutes()).padStart(2, '0')}${ampm}`;
    } catch (e) {
        return dateTimeStr;
    }
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const cardTypes = ['total_balance', 'income', 'expenses', 'recent_transactions', 'accounts_summary', 'budget_summary', 'monthly_income', 'monthly_expenses'];

export default function BudgetPlanningPage({ user, stats, onStatsUpdate }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [activeMonth, setActiveMonth] = useState(() => new Date().getMonth());
    const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());
    const [activePeriod, setActivePeriod] = useState('Daily');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const [btnHover, setBtnHover] = useState(false);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanBudget, setNewPlanBudget] = useState('');
    const [newPlanDay, setNewPlanDay] = useState(1);

    const [editBudgetOpen, setEditBudgetOpen] = useState(false);
    const [editBudgetValue, setEditBudgetValue] = useState('');
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemName, setItemName] = useState('');
    const [itemCategory, setItemCategory] = useState('General');
    const [itemType, setItemType] = useState('Expense');
    const [itemNotes, setItemNotes] = useState('');
    const [itemCalcExpression, setItemCalcExpression] = useState('0');
    const [itemCalcResult, setItemCalcResult] = useState(null);
    const [itemDate, setItemDate] = useState('');
    const [itemTime, setItemTime] = useState('');

    const [selectingCategory, setSelectingCategory] = useState(false);
    const [createCatModalOpen, setCreateCatModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    const loadPlans = async () => {
        try {
            const res = await fetchBudgetPlans();
            setPlans(res.plans || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetchCategories();
            setCategories(res.categories || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { loadPlans(); loadCategories(); }, []);

    const currentPlan = plans.find(p => p.id === selectedPlanId);

    const getPlanStats = (plan) => {
        if (!plan) return { income: 0, expense: 0, remaining: 0, percent: 0 };
        const activeItems = (plan.items || []).filter(i => !i.archived);
        const income = activeItems.filter(i => i.type === 'Income').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
        const expense = activeItems.filter(i => i.type === 'Expense').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
        const budget = parseFloat(plan.budget || 0);
        const remaining = budget + income - expense;
        const percent = (budget + income) > 0 ? Math.min(100, (expense / (budget + income)) * 100) : 0;
        return { income, expense, remaining, percent };
    };

    const planStats = getPlanStats(currentPlan);

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        if (!newPlanName || !newPlanBudget || parseFloat(newPlanBudget) <= 0) {
            return message.error('Please enter a valid plan name and budget.');
        }
        const maxAllowed = parseFloat(stats?.totalSaved) || 0;
        if (parseFloat(newPlanBudget) > maxAllowed) {
            return message.error('Estimated budget cannot exceed your actual total balance of \u20B1' + maxAllowed.toLocaleString('en-US', { minimumFractionDigits: 2 }));
        }
        try {
            const res = await createBudgetPlan({ name: newPlanName, budget: newPlanBudget, year: activeYear, month: activeMonth + 1, day: newPlanDay });
            setPlans([...plans, res.plan]);
            setCreateModalOpen(false);
            setNewPlanName('');
            setNewPlanBudget('');
            message.success('Budget Plan created.');
        } catch { message.error('Failed to create plan.'); }
    };

    const handleDeletePlan = (planId, e) => {
        if (e) e.stopPropagation();
        Modal.confirm({
            title: 'Delete Budget Plan',
            content: 'Are you sure you want to delete this budget plan?',
            okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteBudgetPlan(planId);
                    setPlans(plans.filter(p => p.id !== planId));
                    if (selectedPlanId === planId) setSelectedPlanId(null);
                    message.success('Plan deleted.');
                } catch { message.error('Failed to delete plan.'); }
            }
        });
    };

    const handleUpdatePlanBudget = async (e) => {
        e.preventDefault();
        if (!editBudgetValue || parseFloat(editBudgetValue) <= 0) return message.error('Enter a valid budget.');
        const maxAllowed = parseFloat(stats?.totalSaved) || 0;
        if (parseFloat(editBudgetValue) > maxAllowed) return message.error('Budget exceeds total balance.');
        try {
            const res = await updateBudgetPlan(selectedPlanId, { budget: editBudgetValue });
            setPlans(plans.map(p => p.id === selectedPlanId ? res.plan : p));
            setEditBudgetOpen(false);
            message.success('Budget updated.');
        } catch { message.error('Failed to update budget.'); }
    };

    const handleEditPlanName = async (e) => {
        e.preventDefault();
        if (!editNameValue.trim()) return message.error('Name cannot be empty.');
        try {
            const res = await updateBudgetPlan(selectedPlanId, { name: editNameValue.trim() });
            setPlans(plans.map(p => p.id === selectedPlanId ? res.plan : p));
            setEditNameOpen(false);
            message.success('Name updated.');
        } catch { message.error('Failed to update name.'); }
    };

    const openEditNameModal = () => { setEditNameValue(currentPlan.name); setEditNameOpen(true); };

    const openAddItemModal = () => {
        setEditingItem(null);
        setItemName('');
        const matchingCats = categories.filter(c => (c.type || '').toLowerCase().includes('expense'));
        setItemCategory(matchingCats[0]?.name || 'General');
        setItemType('Expense');
        setItemNotes('');
        setItemCalcExpression('0');
        setItemDate(new Date().toISOString().split('T')[0]);
        const now = new Date();
        setItemTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        setItemModalOpen(true);
    };

    const openEditItemModal = (item) => {
        setEditingItem(item);
        setItemName(item.name || '');
        setItemCategory(item.category || 'General');
        setItemType(item.type || 'Expense');
        setItemNotes(item.notes || '');
        setItemCalcExpression(String(item.amount || '0'));
        const d = item.date ? new Date(item.date) : new Date();
        setItemDate(d.toISOString().split('T')[0]);
        setItemTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
        setItemModalOpen(true);
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        let amtVal = evaluateExpr(itemCalcExpression);
        if (amtVal === null) amtVal = parseFloat(itemCalcExpression) || 0;
        if (amtVal <= 0) return message.error('Enter a valid amount.');
        const payload = {
            name: itemNotes,
            category: itemCategory,
            type: itemType,
            notes: itemNotes,
            amount: amtVal,
            date: `${itemDate} ${itemTime}`,
        };
        try {
            const res = editingItem
                ? await updateBudgetPlanItem(selectedPlanId, editingItem.id, payload)
                : await createBudgetPlanItem(selectedPlanId, payload);
            setPlans(plans.map(p => p.id === selectedPlanId ? res.plan : p));
            setItemModalOpen(false);
            message.success(editingItem ? 'Item updated.' : 'Item added.');
            window.dispatchEvent(new Event('budget_plans_updated'));
        } catch { message.error('Failed to save item.'); }
    };

    const handleToggleArchiveItem = async (itemId) => {
        const item = currentPlan.items.find(i => i.id === itemId);
        try {
            const res = await updateBudgetPlanItem(selectedPlanId, itemId, { archived: !item.archived });
            setPlans(plans.map(p => p.id === selectedPlanId ? res.plan : p));
            message.success('Item archived state toggled.');
        } catch { message.error('Failed to update item.'); }
    };

    const handleDeleteItem = (itemId) => {
        Modal.confirm({
            title: 'Delete Item', content: 'Delete this item?', okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const res = await deleteBudgetPlanItem(selectedPlanId, itemId);
                    setPlans(plans.map(p => p.id === selectedPlanId ? res.plan : p));
                    setSelectedItemIds(prev => prev.filter(id => id !== itemId));
                    message.success('Item deleted.');
                } catch { message.error('Failed to delete item.'); }
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedItemIds.length === 0) return;
        Modal.confirm({
            title: 'Delete Selected Items', content: `Delete ${selectedItemIds.length} items?`, okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
            onOk: async () => {
                try {
                    let updated = currentPlan;
                    for (const id of selectedItemIds) {
                        const res = await deleteBudgetPlanItem(selectedPlanId, id);
                        updated = res.plan;
                    }
                    setPlans(plans.map(p => p.id === selectedPlanId ? updated : p));
                    setSelectedItemIds([]);
                    message.success('Items deleted.');
                } catch { message.error('Failed to delete items.'); }
            }
        });
    };

    const handleBulkArchive = async () => {
        if (selectedItemIds.length === 0) return;
        try {
            let updated = currentPlan;
            for (const id of selectedItemIds) {
                const res = await updateBudgetPlanItem(selectedPlanId, id, { archived: true });
                updated = res.plan;
            }
            setPlans(plans.map(p => p.id === selectedPlanId ? updated : p));
            setSelectedItemIds([]);
            message.success('Items archived.');
        } catch { message.error('Failed to archive items.'); }
    };

    const handleCreateCatSubmit = async (e) => {
        e.preventDefault();
        if (!newCatName) return message.error('Enter a name.');
        try {
            await createCategory({ name: newCatName, type: itemType === 'Income' ? 'income' : 'expense' });
            await loadCategories();
            setItemCategory(newCatName);
            setCreateCatModalOpen(false);
            setSelectingCategory(false);
            message.success('Category added.');
        } catch { message.error('Failed to save category.'); }
    };

    const handleSelectRow = (id) => {
        setSelectedItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        const items = getFilteredItems(currentPlan);
        setSelectedItemIds(selectedItemIds.length === items.length ? [] : items.map(i => i.id));
    };

    const handleKeypadPress = (key) => {
        if (key === '=') {
            const evaluated = evaluateExpr(itemCalcExpression);
            if (evaluated !== null) setItemCalcResult(evaluated);
            else message.error('Invalid expression.');
        } else {
            setItemCalcResult(null);

            const isOperator = ['+', '-', '*', '/'].includes(key);
            let char = key;
            if (key === '*') char = 'x';
            if (key === '/') char = '\u00F7';
            if (isOperator) char = ` ${char} `;

            setItemCalcExpression(prev => prev === '0' && !isOperator && key !== '.' ? char : prev + char);
        }
    };

    useEffect(() => {
        if (!itemModalOpen) return;
        const handler = (e) => {
            if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
            if (/[0-9]/.test(e.key)) { e.preventDefault(); handleKeypadPress(e.key); }
            else if (e.key === '.') { e.preventDefault(); handleKeypadPress('.'); }
            else if (['+', '-', '*', '/'].includes(e.key)) { e.preventDefault(); handleKeypadPress(e.key === '*' ? '*' : e.key); }
            else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleKeypadPress('='); }
            else if (e.key === 'Backspace') { e.preventDefault(); setItemCalcExpression(prev => prev.length <= 1 ? '0' : prev.slice(0, -1)); setItemCalcResult(null); }
            else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') { e.preventDefault(); setItemCalcExpression('0'); setItemCalcResult(null); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [itemModalOpen, itemCalcExpression, itemCalcResult]);

    const getFilteredItems = (plan) => {
        if (!plan || !plan.items) return [];
        return plan.items.filter(item => {
            if (showArchived && !item.archived) return false;
            if (!showArchived && item.archived) return false;
            const datePart = item.date ? item.date.split('T')[0] : null;
            if (!datePart) return false;
            const parts = datePart.split('-');
            const itemYear = parseInt(parts[0], 10);
            const itemMonth = parseInt(parts[1], 10) - 1;
            const itemDay = parseInt(parts[2], 10);
            if (itemYear !== activeYear || itemMonth !== activeMonth) return false;
            if (activePeriod === '1st-15th') return itemDay >= 1 && itemDay <= 15;
            if (activePeriod === '16th-End') return itemDay >= 16;
            return true;
        }).sort((a, b) => {
            const da = a.date || '';
            const db = b.date || '';
            return da < db ? -1 : da > db ? 1 : 0;
        });
    };

    const filteredPlanItems = getFilteredItems(currentPlan);

    const calcKeyStyle = (type) => ({
        width: '100%', padding: '0.85rem', fontSize: '1.25rem', fontWeight: 700,
        borderRadius: '8px', border: '1px solid var(--gray-300)', cursor: 'pointer',
        transition: 'all 0.1s ease',
        background: type === 'op' ? 'var(--red-light)' : type === 'equals' ? 'var(--red)' : '#f3f4f6',
        color: type === 'op' ? 'var(--red)' : type === 'equals' ? 'var(--white)' : '#1f2937',
        display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    });

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading budget plans...</div>;

    return (
        <div className="budget-planning-page" style={{ padding: '2rem', background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--gray-300)', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
            <button type="button" onClick={() => { setNewPlanName(''); setNewPlanBudget(stats?.totalSaved || '0'); setNewPlanDay(new Date().getDate()); setCreateModalOpen(true); }}
                className="mobile-fab" style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '56px', height: '56px', borderRadius: '50%', background: 'var(--red)', color: 'var(--white)', border: 'none', fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>+</button>

            {!selectedPlanId ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--red)', fontWeight: 700, margin: 0 }}>Budget Planning</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: '0.25rem 0 0' }}>Create and manage financial planning sheets for trips, events, or specific savings targets.</p>
                        </div>
                        <button type="button" className="desktop-create-btn" onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)} onClick={() => { setNewPlanName(''); setNewPlanBudget(stats?.totalSaved || '0'); setNewPlanDay(new Date().getDate()); setCreateModalOpen(true); }}
                            style={{ borderRadius: '12px', border: '2px solid var(--red)', color: btnHover ? 'var(--white)' : 'var(--red)', background: btnHover ? 'var(--red)' : 'transparent', fontWeight: 700, padding: '0.5rem 1.5rem', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>+ CREATE PLAN</button>
                    </div>
                    {plans.length === 0 ? (
                        <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '2rem 0' }}>No budget plans yet. Create one to get started.</p>
                    ) : (
                        <>
                            {Math.ceil(plans.length / rowsPerPage) > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Page {currentPage} of {Math.ceil(plans.length / rowsPerPage)}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1.5px solid var(--gray-300)', background: currentPage === 1 ? 'var(--gray-100)' : 'var(--white)', color: currentPage === 1 ? 'var(--gray-400)' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                                        <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(plans.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(plans.length / rowsPerPage)}
                                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1.5px solid var(--gray-300)', background: currentPage === Math.ceil(plans.length / rowsPerPage) ? 'var(--gray-100)' : 'var(--white)', color: currentPage === Math.ceil(plans.length / rowsPerPage) ? 'var(--gray-400)' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.8rem', cursor: currentPage === Math.ceil(plans.length / rowsPerPage) ? 'not-allowed' : 'pointer' }}>Next</button>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                {plans.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map(plan => (
                                    <div key={plan.id} onClick={() => { setSelectedPlanId(plan.id); setCurrentPage(1); }}
                                        style={{ border: '1.5px solid var(--gray-300)', borderRadius: '16px', padding: '1.5rem', background: 'var(--white)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--gray-300)'}>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gray-900)' }}>{plan.name}</span>
                                        <button type="button" onClick={(e) => handleDeletePlan(plan.id, e)}
                                            style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-400)'}>X</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <button type="button" onClick={() => { setSelectedPlanId(null); setSelectedItemIds([]); }}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>&larr; Back to Plans</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>{currentPlan.name}</h2>
                            <button type="button" onClick={openEditNameModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                        </div>
                        <button type="button" onClick={openAddItemModal} style={{ borderRadius: '12px', border: '2px solid var(--red)', color: 'var(--white)', background: 'var(--red)', fontWeight: 700, padding: '0.5rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>+ ADD TRANSACTION / ITEM</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', background: 'var(--gray-50)', border: '1.5px solid var(--gray-300)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.75rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Estimated Budget</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-800)' }}>{formatCurrency(currentPlan.budget)}</span>
                                <button type="button" onClick={() => { setEditBudgetValue(String(currentPlan.budget)); setEditBudgetOpen(true); }} style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Allocated (Expenses)</div>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--red)' }}>{formatCurrency(planStats.expense)}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Planned Incomes</div>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(planStats.income)}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Remaining Balance</div>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: planStats.remaining >= 0 ? '#10b981' : 'var(--red)' }}>{formatCurrency(planStats.remaining)}</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ width: '100%', height: '10px', background: 'var(--gray-200)', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{ width: planStats.percent + '%', height: '100%', background: planStats.remaining < 0 ? 'var(--red)' : '#10b981', transition: 'width 0.3s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>
                            <span>Budget Utilization Progress</span>
                            <span>{planStats.percent.toFixed(1)}% Used</span>
                        </div>
                    </div>

                    <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setActiveYear(y => y - 1)} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer' }}>&lsaquo;</button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gray-800)' }}>{activeYear}</span>
                            <button onClick={() => setActiveYear(y => y + 1)} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer' }}>&rsaquo;</button>
                        </div>
                        <div style={{ display: 'flex', overflowX: 'auto', gap: '0.25rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                            {months.map((m, i) => (
                                <button key={m} type="button" onClick={() => setActiveMonth(i)}
                                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'transparent', color: activeMonth === i ? 'var(--red)' : 'var(--gray-500)', fontWeight: activeMonth === i ? 800 : 600, fontSize: '0.85rem', cursor: 'pointer', borderBottom: activeMonth === i ? '3px solid var(--red)' : 'none', whiteSpace: 'nowrap' }}>{m}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)' }}>View Block:</span>
                            {['Daily', '1st-15th', '16th-End', 'Weekly'].map(p => (
                                <button key={p} type="button" onClick={() => setActivePeriod(p)}
                                    style={{ padding: '0.35rem 1rem', borderRadius: '20px', border: activePeriod === p ? '1.5px solid var(--red)' : '1.5px solid var(--gray-300)', background: activePeriod === p ? 'var(--red)' : 'transparent', color: activePeriod === p ? 'var(--white)' : 'var(--gray-700)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase' }}>{p}</button>
                            ))}
                            <button type="button" onClick={() => setShowArchived(!showArchived)} style={{ marginLeft: '0.5rem', padding: '0.35rem 1rem', borderRadius: '20px', border: '1.5px solid var(--gray-300)', background: 'transparent', color: 'var(--gray-700)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>{showArchived ? 'View Active' : 'View Archived'}</button>
                        </div>
                    </div>

                    {selectedItemIds.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--red-light)', border: '1.5px solid var(--red)', borderRadius: '12px', padding: '0.75rem 1.25rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--red)' }}>{selectedItemIds.length} selected</span>
                            <button type="button" onClick={handleBulkArchive} style={{ background: 'var(--white)', border: '1.5px solid var(--red)', color: 'var(--red)', padding: '0.35rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Archive Selected</button>
                            <button type="button" onClick={handleBulkDelete} style={{ background: 'var(--red)', border: 'none', color: 'var(--white)', padding: '0.35rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Delete Selected</button>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', width: '120px' }}>Actions</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '40px' }}>
                                        <input type="checkbox" checked={filteredPlanItems.length > 0 && selectedItemIds.length === filteredPlanItems.length} onChange={handleSelectAll} />
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', width: '200px' }}>Date & Time</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Notes</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '140px' }}>Amount</th>
                                    <th style={{ padding: '0.75rem 1rem', width: '100px' }}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlanItems.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-200)', background: selectedItemIds.includes(item.id) ? 'var(--red-light)' : 'transparent', opacity: item.archived ? 0.6 : 1 }}>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <button type="button" onClick={() => openEditItemModal(item)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.25rem', color: 'var(--gray-600)', marginRight: '0.25rem' }}><EditOutlined /></button>
                                            <button type="button" onClick={() => handleToggleArchiveItem(item.id)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.25rem', color: 'var(--gray-600)', marginRight: '0.25rem' }}><InboxOutlined /></button>
                                            <button type="button" onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.25rem', color: 'var(--gray-600)' }}><DeleteOutlined /></button>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}><input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => handleSelectRow(item.id)} /></td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>{item.date ? formatFriendlyDateTime(item.date) : '\u2014'}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--gray-900)' }}>{item.notes || '\u2014'}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: item.type === 'Income' ? '#10b981' : 'var(--gray-900)' }}>{item.type === 'Income' ? '+' : '-'}{formatCurrency(item.amount)}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: item.type === 'Income' ? '#d1fae5' : 'var(--red-light)', color: item.type === 'Income' ? '#10b981' : 'var(--red)', textTransform: 'uppercase' }}>{item.type}</span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPlanItems.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--gray-400)' }}>No items found for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <Modal title="Create Budget Plan" open={createModalOpen} onCancel={() => setCreateModalOpen(false)} footer={null} styles={{ body: { padding: '1.5rem' } }}>
                <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.35rem', display: 'block' }}>Plan Name :</label>
                        <input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} className="form-control" placeholder="e.g. Cebu Trip, Tokyo Vacation" required />
                    </div>
                    <div>
                        <label style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.35rem', display: 'block' }}>Estimated Starting Budget :</label>
                        <input type="number" step="0.01" value={newPlanBudget} onChange={e => setNewPlanBudget(e.target.value)} className="form-control" placeholder="P 0.00" required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>Create Plan</button>
                    </div>
                </form>
            </Modal>

            <Modal title="Edit Plan Budget" open={editBudgetOpen} onCancel={() => setEditBudgetOpen(false)} footer={null} styles={{ body: { padding: '1.5rem' } }}>
                <form onSubmit={handleUpdatePlanBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <label style={{ fontWeight: 700, color: 'var(--gray-700)', display: 'block' }}>Estimated Budget :</label>
                    <input type="number" step="0.01" value={editBudgetValue} onChange={e => setEditBudgetValue(e.target.value)} className="form-control" required />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setEditBudgetOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>Update</button>
                    </div>
                </form>
            </Modal>

            <Modal title="Edit Plan Name" open={editNameOpen} onCancel={() => setEditNameOpen(false)} footer={null} styles={{ body: { padding: '1.5rem' } }}>
                <form onSubmit={handleEditPlanName} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <label style={{ fontWeight: 700, color: 'var(--gray-700)', display: 'block' }}>Plan Name :</label>
                    <input type="text" value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="form-control" required />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setEditNameOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>Update</button>
                    </div>
                </form>
            </Modal>

            <Modal open={itemModalOpen} onCancel={() => setItemModalOpen(false)} footer={null} closable={false} styles={{ body: { padding: '1.25rem' } }}>
                <form onSubmit={handleSaveItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <button type="button" onClick={() => setItemModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>X CANCEL</button>
                        <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>V SAVE</button>
                    </div>
                    <div style={{ border: '1.5px solid var(--gray-300)', borderRadius: '12px', display: 'flex', overflow: 'hidden', marginBottom: '1.25rem' }}>
                        {['Income', 'Expense'].map(t => (
                            <div key={t} onClick={() => { setItemType(t); const m = categories.filter(c => (c.type || '').toLowerCase().includes(t.toLowerCase())); setItemCategory(m[0]?.name || 'General'); }}
                                style={{ flex: 1, padding: '0.75rem', textAlign: 'center', cursor: 'pointer', background: itemType === t ? 'var(--red-light)' : 'transparent', color: itemType === t ? 'var(--red)' : 'var(--gray-500)', fontWeight: 700, fontSize: '0.9rem', borderRight: t !== 'Expense' ? '1.5px solid var(--gray-300)' : 'none', userSelect: 'none' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: itemType === t ? 'var(--red)' : 'transparent', color: 'var(--white)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', marginRight: '0.25rem' }}>{itemType === t ? 'V' : ''}</span>
                                {t.toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.25rem', textAlign: 'center' }}>Category</div>
                        <button type="button" onClick={() => setSelectingCategory(true)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid var(--gray-300)', background: 'var(--white)', fontWeight: 700, color: 'var(--gray-700)', cursor: 'pointer' }}>{itemCategory || 'Select Category'}</button>
                    </div>
                    <div style={{ border: '1.5px solid var(--gray-300)', borderRadius: '12px', padding: '0.75rem', background: '#FFFDE7', marginBottom: '1.25rem' }}>
                        <textarea value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="Add transaction notes" style={{ width: '100%', height: '60px', border: 'none', outline: 'none', background: 'transparent', resize: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ border: '1.5px solid var(--gray-300)', borderRadius: '12px', padding: '0.75rem 1rem', background: 'var(--white)', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gray-900)', wordBreak: 'break-all' }}>{itemCalcExpression}</div>
                            <button type="button" onClick={() => { setItemCalcExpression(prev => prev.length <= 1 ? '0' : prev.slice(0, -1)); setItemCalcResult(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}>BK</button>
                        </div>
                        {itemCalcResult !== null && (
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--red)',
                                borderTop: '1px solid var(--gray-200)',
                                paddingTop: '0.5rem',
                                marginTop: '0.5rem',
                                textAlign: 'right'
                            }}>
                                = {itemCalcResult}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
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
                        <button type="button" onClick={() => handleKeypadPress('/')} style={calcKeyStyle('op')}>/</button>
                        <button type="button" onClick={() => handleKeypadPress('0')} style={calcKeyStyle('num')}>0</button>
                        <button type="button" onClick={() => handleKeypadPress('.')} style={calcKeyStyle('num')}>.</button>
                        <button type="button" onClick={() => handleKeypadPress('=')} style={calcKeyStyle('equals')}>=</button>
                    </div>
                    <div style={{ display: 'flex', borderTop: '1px solid var(--gray-300)', padding: '0.75rem 0 0', marginTop: '0.5rem', justifyContent: 'space-between' }}>
                        <input type="date" value={itemDate} onChange={e => setItemDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700, color: 'var(--red)', cursor: 'pointer' }} />
                        <input type="time" value={itemTime} onChange={e => setItemTime(e.target.value)} style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700, color: 'var(--red)', cursor: 'pointer' }} />
                    </div>
                </form>
            </Modal>

            <Modal title="Select a category" open={selectingCategory} onCancel={() => setSelectingCategory(false)} footer={null} styles={{ body: { padding: '1rem' } }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {categories.filter(c => (c.type || '').toLowerCase().includes(itemType.toLowerCase())).map(cat => (
                        <div key={cat.id} onClick={() => { setItemCategory(cat.name); setSelectingCategory(false); }}
                            style={{ padding: '0.85rem', borderRadius: '12px', border: '1.5px solid var(--gray-300)', cursor: 'pointer', background: 'var(--white)', fontWeight: 700, color: 'var(--gray-800)' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-300)'}>{cat.name}</div>
                    ))}
                    {categories.filter(c => (c.type || '').toLowerCase().includes(itemType.toLowerCase())).length === 0 && <p style={{ color: 'var(--gray-500)' }}>No {itemType} categories yet.</p>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
                    <button type="button" onClick={() => { setNewCatName(''); setCreateCatModalOpen(true); }}
                        style={{ borderRadius: '12px', border: '2px solid var(--red)', color: 'var(--red)', background: 'transparent', fontWeight: 700, width: '100%', padding: '0.75rem', cursor: 'pointer' }}>+ ADD NEW CATEGORY</button>
                </div>
            </Modal>

            <Modal title="Add Category" open={createCatModalOpen} onCancel={() => setCreateCatModalOpen(false)} footer={null} styles={{ body: { padding: '1.5rem' } }}>
                <form onSubmit={handleCreateCatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ border: '1.5px solid var(--gray-300)', borderRadius: '12px', display: 'flex', overflow: 'hidden' }}>
                        <div style={{ flex: 1, padding: '1rem', textAlign: 'center', background: 'var(--red-light)', color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>{itemType.toUpperCase()}</div>
                    </div>
                    <div>
                        <label style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.35rem', display: 'block' }}>Category Name :</label>
                        <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="form-control" placeholder="e.g. Flight, Lodging" required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setCreateCatModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>Save</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
