import React from 'react';
import { SUFFIX_OPTIONS, normalizeSuffix } from '../constants/suffixOptions';

export default function SuffixSelect({
    id,
    name,
    value,
    onChange,
    disabled = false,
    required = false,
}) {
    const selectedValue = normalizeSuffix(value);

    return (
        <select
            id={id}
            name={name}
            className="form-control"
            value={selectedValue}
            onChange={onChange}
            disabled={disabled}
            required={required}
        >
            {SUFFIX_OPTIONS.map((option) => (
                <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
