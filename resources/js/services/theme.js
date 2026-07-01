const STORAGE_KEY = 'epawn-theme';

export function getStoredTheme() {
    try {
        var t = localStorage.getItem(STORAGE_KEY);
        return (t === 'dark' || t === 'light') ? t : 'light';
    } catch {
        return 'light';
    }
}

export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
    }
}

export function initTheme() {
    const theme = getStoredTheme();
    applyTheme(theme);
    return theme;
}
