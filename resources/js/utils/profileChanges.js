const PROFILE_FIELDS = {
    first_name: 'First name',
    middle_initial: 'Middle initial',
    last_name: 'Last name',
    suffix: 'Suffix',
    username: 'Username',
};

function normalizeValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
}

export function getChangedProfileFields(original, updated) {
    const changed = [];

    Object.entries(PROFILE_FIELDS).forEach(([key, label]) => {
        if (normalizeValue(original?.[key]) !== normalizeValue(updated?.[key])) {
            changed.push({ key, label });
        }
    });

    return changed;
}

export function buildProfileUpdateMessage(changedFields) {
    if (changedFields.length === 0) {
        return null;
    }

    if (changedFields.length === 1) {
        return `${changedFields[0].label} updated successfully.`;
    }

    const labels = changedFields.map((field) => field.label.toLowerCase()).join(', ');

    return `Profile updated successfully (${labels}).`;
}
