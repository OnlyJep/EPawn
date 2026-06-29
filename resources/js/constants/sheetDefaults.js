export const DEFAULT_SHEET_COLUMNS = [
    'Month',
    'Estimated Budget',
    'Total Available Funds',
    'Salary Estimated',
    'Loaned',
    'Total Expenses',
    'Savings End Balance',
];

export function formatCurrency(value) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return value;
    }

    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatApiErrors(error) {
    if (! error?.response?.data?.errors) {
        return [error?.response?.data?.message || 'Something went wrong. Please try again.'];
    }

    return Object.values(error.response.data.errors).flat();
}
