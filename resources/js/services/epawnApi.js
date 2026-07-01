import axios from 'axios';
import { clearEpawn, getEpawn, setEpawn } from './epawnStorage';

const API_BASE = '/api';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

let csrfReady = false;

axios.interceptors.request.use(function (config) {
    const token = getEpawn().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + encodeURIComponent(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf() {
    if (csrfReady) return;
    try {
        await axios.get('/sanctum/csrf-cookie');
        const token = getCookie('XSRF-TOKEN');
        if (token) {
            axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
            csrfReady = true;
        }
    } catch (e) {
        // Will retry on next call
    }
}

function storeDashboard(data) {
    return setEpawn({
        user: data.user,
        logo: data.logo,
        defaultAvatar: data.defaultAvatar,
        csrf: data.csrf,
        routes: data.routes,
        stats: data.stats,
        dashboard: data,
        flash: data.flash || {},
        errors: data.errors || {},
        old: data.old || {},
    });
}

export async function loadDashboard() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/dashboard`);

    storeDashboard(data);

    return data;
}

export async function login(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/login`, payload);

    setEpawn({ user: data.user, token: data.token });

    return data;
}

export async function register(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/register`, payload);

    setEpawn({ user: data.user, token: data.token });

    return data;
}

export async function checkUsername(username) {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/check-username`, {
        params: { username },
    });
    return data;
}

export async function checkEmail(email) {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/check-email`, {
        params: { email },
    });
    return data;
}

export async function logout() {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/logout`);

    clearEpawn();

    return data;
}

export function clearToken() {
    const current = getEpawn();
    if (current.token) {
        delete current.token;
        try {
            localStorage.setItem('Epawn', JSON.stringify(current));
        } catch {}
    }
}

export async function updateProfile(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/settings/profile`, payload);

    setEpawn({ user: data.user });

    return data;
}

export async function updatePassword(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/settings/password`, payload);

    return data;
}

export async function resetPasswordSurvey(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/forgot-password/reset`, payload);

    return data;
}

export async function deleteAccount(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/user/delete`, payload);

    clearEpawn();

    return data;
}

export async function fetchBudgetPlans() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/budget-plans`);
    return data;
}

export async function createBudgetPlan(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/budget-plans`, payload);
    return data;
}

export async function updateBudgetPlan(id, payload) {
    await ensureCsrf();
    const { data } = await axios.put(`${API_BASE}/budget-plans/${id}`, payload);
    return data;
}

export async function deleteBudgetPlan(id) {
    await ensureCsrf();
    const { data } = await axios.delete(`${API_BASE}/budget-plans/${id}`);
    return data;
}

export async function createBudgetPlanItem(planId, payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/budget-plans/${planId}/items`, payload);
    return data;
}

export async function updateBudgetPlanItem(planId, itemId, payload) {
    await ensureCsrf();
    const { data } = await axios.put(`${API_BASE}/budget-plans/${planId}/items/${itemId}`, payload);
    return data;
}

export async function deleteBudgetPlanItem(planId, itemId) {
    await ensureCsrf();
    const { data } = await axios.delete(`${API_BASE}/budget-plans/${planId}/items/${itemId}`);
    return data;
}

export async function fetchDashboardData() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/dashboard-data`);
    return data;
}

export async function fetchCategories() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/categories`);
    return data;
}

export async function createCategory(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/categories`, payload);
    return data;
}

export async function updateCategory(id, payload) {
    await ensureCsrf();
    const { data } = await axios.put(`${API_BASE}/categories/${id}`, payload);
    return data;
}

export async function deleteCategory(id) {
    await ensureCsrf();
    const { data } = await axios.delete(`${API_BASE}/categories/${id}`);
    return data;
}

export async function fetchAccounts() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/accounts`);
    return data;
}

export async function createAccount(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/accounts`, payload);
    return data;
}

export async function updateAccount(id, payload) {
    await ensureCsrf();
    const { data } = await axios.put(`${API_BASE}/accounts/${id}`, payload);
    return data;
}

export async function deleteAccountApi(id) {
    await ensureCsrf();
    const { data } = await axios.delete(`${API_BASE}/accounts/${id}`);
    return data;
}

export async function fetchTransactions() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/transactions`);
    return data;
}

export async function createTransaction(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/transactions`, payload);
    return data;
}

export async function updateTransaction(id, payload) {
    await ensureCsrf();
    const { data } = await axios.put(`${API_BASE}/transactions/${id}`, payload);
    return data;
}

export async function deleteTransaction(id) {
    await ensureCsrf();
    const { data } = await axios.delete(`${API_BASE}/transactions/${id}`);
    return data;
}

export async function fetchBudgets() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/budgets`);
    return data;
}

export async function createBudget(payload) {
    await ensureCsrf();
    const { data } = await axios.post(`${API_BASE}/budgets`, payload);
    return data;
}

export async function updateBudget(id, payload) {
    await ensureCsrf();
    const { data } = await axios.put(`${API_BASE}/budgets/${id}`, payload);
    return data;
}

export async function deleteBudget(id) {
    await ensureCsrf();
    const { data } = await axios.delete(`${API_BASE}/budgets/${id}`);
    return data;
}

export async function fetchUser() {
    await ensureCsrf();
    const { data } = await axios.get(`${API_BASE}/user`);

    setEpawn({ user: data.user });

    return data;
}

export function getCachedDashboard() {
    return getEpawn().dashboard || null;
}

if (typeof window !== 'undefined') {
    window.EpawnApi = {
        loadDashboard,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        deleteAccount,
        resetPasswordSurvey,
        fetchUser,
        checkUsername,
        checkEmail,
        fetchDashboardData,
        fetchBudgetPlans,
        createBudgetPlan,
        updateBudgetPlan,
        deleteBudgetPlan,
        createBudgetPlanItem,
        updateBudgetPlanItem,
        deleteBudgetPlanItem,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        fetchAccounts,
        createAccount,
        updateAccount,
        deleteAccountApi,
        fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        fetchBudgets,
        createBudget,
        updateBudget,
        deleteBudget,
        getCachedDashboard,
    };
}
