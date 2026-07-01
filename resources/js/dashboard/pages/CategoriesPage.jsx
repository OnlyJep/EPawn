import React, { useState, useEffect } from 'react';
import { message, Modal, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../../services/epawnApi';

export default function CategoriesPage({
    onStatsUpdate,
    onRefreshSheets
}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    // Form states
    const [categoryName, setCategoryName] = useState('');
    const [type, setType] = useState('Expense');
    const [btnHover, setBtnHover] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchCategories();
            setRows(res.categories || []);
        } catch (error) {
            console.error(error);
            message.error('Failed to load categories.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openCreateModal = () => {
        setEditingRow(null);
        setCategoryName('');
        setType('Expense');
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingRow(row);
        setCategoryName(row.name || '');
        setType(row.type === 'income' ? 'Income' : 'Expense');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName) {
            message.error('Please fill in all required fields.');
            return;
        }

        const payload = {
            name: categoryName,
            type: type.toLowerCase()
        };

        try {
            if (editingRow) {
                await updateCategory(editingRow.id, payload);
                message.success('Category updated successfully.');
            } else {
                await createCategory(payload);
                message.success('Category added successfully.');
            }
            setModalOpen(false);
            loadData();
            if (onRefreshSheets) onRefreshSheets();
        } catch (error) {
            message.error('Failed to save category.');
        }
    };

    const handleDelete = async (rowId) => {
        Modal.confirm({
            title: 'Delete Category',
            content: 'Are you sure you want to delete this category? Associated transactions will keep their values, but this category choice will be deleted.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteCategory(rowId);
                    message.success('Category deleted.');
                    loadData();
                    if (onRefreshSheets) onRefreshSheets();
                } catch (error) {
                    message.error('Failed to delete category.');
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
        <div className="categories-page" style={{ padding: '2rem', background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--gray-300)', position: 'relative' }}>
            
            {/* Floating Add Category Button for Mobile */}
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
            
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--red)', fontWeight: 700, margin: 0 }}>Categories</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>Configure custom Expense and Income categories for tracking.</p>
                </div>
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
                        + ADD NEW CATEGORY
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-500)', marginRight: '0.5rem' }}>Filter by:</span>
                
                {/* Desktop: Show all buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }} className="desktop-filters">
                    {['All', 'Income', 'Expense'].map(filterOpt => {
                        const isActive = activeFilter === filterOpt;
                        return (
                            <button
                                key={filterOpt}
                                type="button"
                                onClick={() => {
                                    setActiveFilter(filterOpt);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    padding: '0.4rem 1.25rem',
                                    borderRadius: '20px',
                                    border: isActive ? '1.5px solid var(--red)' : '1.5px solid var(--gray-300)',
                                    background: isActive ? 'var(--red)' : 'transparent',
                                    color: isActive ? '#ffffff' : 'var(--gray-700)',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
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

                {/* Mobile: Show dropdown */}
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
                            {['All', 'Income', 'Expense'].map(filterOpt => (
                                <button
                                    key={filterOpt}
                                    type="button"
                                    onClick={() => {
                                        setActiveFilter(filterOpt);
                                        setCurrentPage(1);
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

            {/* List section */}
            {loading ? (
                <p>Loading categories...</p>
            ) : (() => {
                const filteredRows = rows.filter(row => {
                    if (activeFilter === 'All') return true;
                    const rType = (row.type || '').toLowerCase();
                    return rType.includes(activeFilter.toLowerCase());
                });

                if (filteredRows.length === 0) {
                    return <p style={{ color: 'var(--gray-500)' }}>No categories of this type created yet.</p>;
                }

                const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
                const paginatedRows = filteredRows.slice(
                    (currentPage - 1) * rowsPerPage,
                    currentPage * rowsPerPage
                );

                return (
                    <>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                    Page {currentPage} of {totalPages} ({filteredRows.length} total)
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

                        <div style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', display: 'grid', gap: '1.5rem' }}>
                            {paginatedRows.map((row) => {
                        const isExpense = (row.type || '').toLowerCase().includes('expense');
                        const name = row.name || 'Unnamed Category';
                        const catType = row.type === 'income' ? 'Income' : 'Expense';

                        return (
                            <div key={row.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1.25rem',
                                borderRadius: '16px',
                                border: '1.5px solid var(--gray-300)',
                                background: 'var(--white)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gray-900)', marginBottom: '0.35rem' }}>
                                        {name}
                                    </div>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '6px',
                                        fontWeight: 700,
                                        background: isExpense ? 'var(--red-light)' : 'var(--gray-100)',
                                        color: isExpense ? 'var(--red)' : 'var(--gray-700)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}>
                                        {catType}
                                    </span>
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
                                        onClick: ({ key }) => {
                                            handleMenuClick(key, row);
                                        },
                                    }}
                                >
                                    <button
                                        type="button"
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
                );
            })()}

            {/* Modal */}
            <Modal
                title={editingRow ? 'Edit Category' : 'Add Category'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                classNames={{ wrapper: 'add-category-modal', header: 'add-category-header', body: 'add-category-body' }}
            >
                <form className="category-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Custom INCOME | EXPENSE Toggle selection (Fits corner-to-corner at top of modal) */}
                    <div>
                        <div style={{
                            border: '1.5px solid var(--gray-300)',
                            borderRadius: '12px',
                            display: 'flex',
                            overflow: 'hidden',
                            background: 'var(--white)'
                        }}>
                            <div 
                                onClick={() => setType('Income')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    background: type === 'Income' ? 'var(--red-light)' : 'transparent',
                                    color: type === 'Income' ? 'var(--red)' : 'var(--gray-500)',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s',
                                    borderRight: '1.5px solid var(--gray-300)',
                                    userSelect: 'none'
                                }}
                            >
                                {type === 'Income' && (
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
                                INCOME
                            </div>
                            <div 
                                onClick={() => setType('Expense')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    background: type === 'Expense' ? 'var(--red-light)' : 'transparent',
                                    color: type === 'Expense' ? 'var(--red)' : 'var(--gray-500)',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s',
                                    userSelect: 'none'
                                }}
                            >
                                {type === 'Expense' && (
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
                                EXPENSE
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Category Name</label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="e.g. Food, Salary, Rent"
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
