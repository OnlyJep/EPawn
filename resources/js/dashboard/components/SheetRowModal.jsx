import React, { useEffect, useState } from 'react';

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#424242" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
    );
}

export default function SheetRowModal({ columns, initialRow, onClose, onSave, activeTab, currentBalance = 0 }) {
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Filter columns based on active tab for bank sheets
    const displayColumns = activeTab
        ? columns.filter(col => {
            if (col.column_type === 'month') return true;
            const colName = col.name.toLowerCase();
            if (activeTab === 'payroll') {
                return colName.includes('payroll');
            } else if (activeTab === 'savings') {
                return colName.includes('savings');
            }
            return true;
        })
        : columns;

    useEffect(() => {
        const initial = {};

        // Initialize with ALL columns to preserve data for hidden ones
        columns.forEach((column) => {
            // Auto-populate date/month columns with current PHT date for new rows
            if (!initialRow && column.column_type === 'month') {
                const now = new Date();
                const phtDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
                // Format as YYYY-MM-DD for date input
                const year = phtDate.getFullYear();
                const month = String(phtDate.getMonth() + 1).padStart(2, '0');
                const day = String(phtDate.getDate()).padStart(2, '0');
                initial[column.column_key] = `${year}-${month}-${day}`;
            } else {
                initial[column.column_key] = initialRow?.data?.[column.column_key] ?? '';
            }
        });

        setFormData(initial);
    }, [columns, initialRow]);

    const handleChange = (key) => (event) => {
        setFormData((current) => ({
            ...current,
            [key]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        // Validate withdrawals don't exceed current balance for bank sheets
        if (activeTab) {
            let totalWithdrawal = 0;
            displayColumns.forEach((col) => {
                const colName = col.name.toLowerCase();
                if (colName.includes('withdraw') || colName.includes('spent')) {
                    totalWithdrawal += parseFloat(formData[col.column_key]) || 0;
                }
            });

            // For editing, subtract the original withdrawal amount from the new one
            if (initialRow) {
                displayColumns.forEach((col) => {
                    const colName = col.name.toLowerCase();
                    if (colName.includes('withdraw') || colName.includes('spent')) {
                        const originalValue = initialRow.data?.[col.column_key] || 0;
                        totalWithdrawal -= originalValue;
                    }
                });
            }

            // Prevent withdrawals if balance is 0 or insufficient
            if (currentBalance <= 0 && totalWithdrawal > 0) {
                setError('Cannot withdraw when balance is 0 or negative.');
                return;
            }

            if (totalWithdrawal > currentBalance) {
                setError(`Insufficient funds. Current balance: ${currentBalance.toFixed(2)}, Withdrawal amount: ${totalWithdrawal.toFixed(2)}`);
                return;
            }
        }

        setSubmitting(true);

        try {
            // Only save data for columns visible in the current tab
            const filteredData = {};
            displayColumns.forEach((col) => {
                filteredData[col.column_key] = formData[col.column_key];
            });
            await onSave(filteredData);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay active">
            <div className="modal modal--wide sheet-row-modal">
                <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </button>
                <h2>{initialRow ? 'Edit Row' : 'Add Row'}</h2>
                <p className="modal-subtitle">Fill in the values for each column in this sheet.</p>

                {error && (
                    <div style={{
                        background: '#FFEBEE',
                        color: '#dc2626',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                        borderLeft: '4px solid #dc2626'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="sheet-row-modal__grid">
                        {displayColumns.map((column) => (
                            <div className="form-group" key={column.id}>
                                <label htmlFor={`row-${column.column_key}`}>
                                    {column.name}
                                    {column.column_type === 'estimated' && (
                                        <span className="sheet-tag">Estimated</span>
                                    )}
                                </label>
                                {column.column_type === 'month' ? (
                                    <input
                                        type="date"
                                        id={`row-${column.column_key}`}
                                        className="form-control"
                                        value={formData[column.column_key] ?? ''}
                                        onChange={handleChange(column.column_key)}
                                    />
                                ) : column.name.toLowerCase().includes('type') ? (
                                    <input
                                        type="text"
                                        id={`row-${column.column_key}`}
                                        className="form-control"
                                        value={formData[column.column_key] ?? ''}
                                        onChange={handleChange(column.column_key)}
                                        placeholder="e.g. Food, Transportation"
                                    />
                                ) : (
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        id={`row-${column.column_key}`}
                                        className="form-control"
                                        value={formData[column.column_key] ?? ''}
                                        onChange={handleChange(column.column_key)}
                                        placeholder="0.00"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : initialRow ? 'Save Row' : 'Add Row'}
                    </button>
                </form>
            </div>
        </div>
    );
}
