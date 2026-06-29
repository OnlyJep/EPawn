import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { DEFAULT_SHEET_COLUMNS } from '../../constants/sheetDefaults';
import { formatApiErrors } from '../../constants/sheetDefaults';

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#424242" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
    );
}

export default function SheetSetupModal({
    open,
    onClose,
    onSubmit,
    initialSheet = null,
}) {
    const [name, setName] = useState('');
    const [columns, setColumns] = useState(['']);
    const [submitting, setSubmitting] = useState(false);
    const [accountTypes, setAccountTypes] = useState({ payroll: false, savings: false });

    const isBankSheet = name.toLowerCase().includes('bank');
    const isExpenseSheet = name.toLowerCase().includes('expense');

    useEffect(() => {
        if (open) {
            setName(initialSheet?.name || '');
            setColumns(
                initialSheet?.columns?.length
                    ? initialSheet.columns.map((column) => column.name)
                    : ['']
            );
            
            // Detect account types from existing columns when editing
            if (initialSheet?.columns?.length) {
                const hasPayroll = initialSheet.columns.some(col => 
                    col.name.toLowerCase().includes('payroll')
                );
                const hasSavings = initialSheet.columns.some(col => 
                    col.name.toLowerCase().includes('savings')
                );
                setAccountTypes({ payroll: hasPayroll, savings: hasSavings });
            } else {
                setAccountTypes({ payroll: false, savings: false });
            }
        }
    }, [open, initialSheet]);

    useEffect(() => {
        if (isBankSheet && (accountTypes.payroll || accountTypes.savings)) {
            let newColumns = ['Date'];
            if (accountTypes.payroll && accountTypes.savings) {
                newColumns = ['Date', 'Payroll Deposit', 'Payroll Withdraw', 'Savings Deposit', 'Savings Withdraw'];
            } else if (accountTypes.payroll) {
                newColumns = ['Date', 'Payroll Deposit', 'Payroll Withdraw'];
            } else if (accountTypes.savings) {
                newColumns = ['Date', 'Savings Deposit', 'Savings Withdraw'];
            }
            setColumns(newColumns);
        } else if (isExpenseSheet) {
            // Fixed columns for expense sheets
            setColumns(['Date', 'Expenses Amount', 'Type of Expense']);
        } else if (!isBankSheet) {
            setColumns(['']);
        }
    }, [accountTypes, isBankSheet, isExpenseSheet]);

    if (!open) {
        return null;
    }

    const handleColumnChange = (index, value) => {
        setColumns((current) => current.map((column, i) => (i === index ? value : column)));
    };

    const handleAddColumn = () => {
        setColumns((current) => [...current, '']);
    };

    const handleRemoveColumn = (index) => {
        if (columns.length <= 1) {
            message.error('At least one column is required.');
            return;
        }

        setColumns((current) => current.filter((_, i) => i !== index));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const cleanedColumns = columns.map((column) => column.trim()).filter(Boolean);

        if (!name.trim()) {
            message.error('Sheet name is required.');
            return;
        }

        if (cleanedColumns.length === 0) {
            message.error('At least one column is required.');
            return;
        }

        setSubmitting(true);

        try {
            await onSubmit({
                name: name.trim(),
                columns: cleanedColumns,
            });
            onClose();
        } catch (error) {
            message.error(formatApiErrors(error)[0]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay active">
            <div className="modal modal--wide sheet-setup-modal">
                <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </button>
                <h2>{initialSheet ? 'Edit Sheet' : 'Create Sheet'}</h2>
                <p className="modal-subtitle">
                    Name your sidebar sheet and define column headers like Excel. The database table is created automatically.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="sheet-name">Sheet Name</label>
                        <input
                            type="text"
                            id="sheet-name"
                            className="form-control"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Monthly Finance"
                            required
                        />
                    </div>

                    {isBankSheet && (
                        <div className="form-group">
                            <label>Account Types</label>
                            <div className="account-types-container">
                                <label className="account-type-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={accountTypes.payroll}
                                        onChange={(e) => setAccountTypes({ ...accountTypes, payroll: e.target.checked })}
                                    />
                                    <span className="checkbox-label">Payroll Account</span>
                                </label>
                                <label className="account-type-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={accountTypes.savings}
                                        onChange={(e) => setAccountTypes({ ...accountTypes, savings: e.target.checked })}
                                    />
                                    <span className="checkbox-label">Savings Account</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ marginBottom: 0 }}>Columns</label>
                            {!isBankSheet && (
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={handleAddColumn}
                                >
                                    + Add Column
                                </button>
                            )}
                        </div>
                        {columns.map((column, index) => (
                            <div key={`column-${index}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={column}
                                    onChange={(event) => handleColumnChange(index, event.target.value)}
                                    placeholder={`Column ${index + 1}`}
                                    required
                                    disabled={isBankSheet || isExpenseSheet}
                                />
                                {!isBankSheet && !isExpenseSheet && index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveColumn(index)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            background: '#FFEBEE',
                                            border: '1px solid #FFCDD2',
                                            borderRadius: '10px',
                                            color: '#C62828',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            minWidth: '44px',
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        {(isBankSheet || isExpenseSheet) && (
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                {isBankSheet ? 'Columns are automatically configured based on selected account types.' : 'Columns are automatically configured for expense tracking.'}
                            </p>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : initialSheet ? 'Save Sheet' : 'Create Sheet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
