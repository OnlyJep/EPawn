const STORAGE_KEY = 'Epawn';

export function getEpawn() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (! raw) {
            return {};
        }

        return JSON.parse(raw);
    } catch {
        return {};
    }
}

export function setEpawn(data) {
    const current = getEpawn();
    const next = {
        ...current,
        ...data,
        updatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    return next;
}

export function getEpawnItem(key, fallback = null) {
    const data = getEpawn();

    return data[key] ?? fallback;
}

export function setEpawnItem(key, value) {
    return setEpawn({ [key]: value });
}

export function getEpawnUser() {
    return getEpawnItem('user', null);
}

export function clearEpawn() {
    localStorage.removeItem(STORAGE_KEY);
}

if (typeof window !== 'undefined') {
    window.getEpawn = getEpawn;
    window.setEpawn = setEpawn;
    window.getEpawnItem = getEpawnItem;
    window.setEpawnItem = setEpawnItem;
    window.getEpawnUser = getEpawnUser;
    window.clearEpawn = clearEpawn;
}
