export const SUFFIX_OPTIONS = [
    { value: '', label: '— None —' },
    { value: 'Jr.', label: 'Jr.' },
    { value: 'Sr.', label: 'Sr.' },
    { value: 'II', label: 'II' },
    { value: 'III', label: 'III' },
    { value: 'IV', label: 'IV' },
];

export const SUFFIX_VALUES = SUFFIX_OPTIONS.map((option) => option.value).filter(Boolean);

export function normalizeSuffix(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
}

export function getSuffixDescription(value) {
    const match = SUFFIX_OPTIONS.find((option) => option.value === normalizeSuffix(value));

    return match?.description || '';
}
