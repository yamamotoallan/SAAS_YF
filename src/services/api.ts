const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
export const getToken = (): string | null => localStorage.getItem('yf_token');
export const setToken = (token: string): void => localStorage.setItem('yf_token', token);
export const removeToken = (): void => localStorage.removeItem('yf_token');

export const getUser = () => {
    const raw = localStorage.getItem('yf_user');
    return raw ? JSON.parse(raw) : null;
};
export const setUser = (user: any): void => localStorage.setItem('yf_user', JSON.stringify(user));
export const removeUser = (): void => localStorage.removeItem('yf_user');

// Fetch wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        removeToken();
        removeUser();
        window.location.href = '/login';
        throw new Error('Sessão expirada');
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || 'Erro na requisição');
    }

    return res.json();
}

// ============ AUTH ============
export const api = {
    auth: {
        login: (email: string, password: string) =>
            request<{ token: string; user: any }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }),
        register: (data: any) =>
            request<{ token: string; user: any }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        me: () => request<any>('/auth/me'),
    },

    // ============ DASHBOARD ============
    dashboard: {
        get: () => request<any>('/dashboard'),
    },

    // ============ CLIENTS ============
    clients: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any[]>(`/clients${query}`);
        },
        get: (id: string) => request<any>(`/clients/${id}`),
        create: (data: any) =>
            request<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<any>(`/clients/${id}`, { method: 'DELETE' }),
    },

    // ============ FLOWS ============
    flows: {
        list: () => request<any[]>('/flows'),
        get: (id: string) => request<any>(`/flows/${id}`),
        create: (data: any) =>
            request<any>('/flows', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            request<any>(`/flows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<any>(`/flows/${id}`, { method: 'DELETE' }),
        addStage: (flowId: string, data: any) =>
            request<any>(`/flows/${flowId}/stages`, { method: 'POST', body: JSON.stringify(data) }),
    },

    // ============ ITEMS ============
    items: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any[]>(`/items${query}`);
        },
        get: (id: string) => request<any>(`/items/${id}`),
        create: (data: any) =>
            request<any>('/items', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            request<any>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        move: (id: string, stageId: string) =>
            request<any>(`/items/${id}/move`, { method: 'PATCH', body: JSON.stringify({ stageId }) }),
        delete: (id: string) =>
            request<any>(`/items/${id}`, { method: 'DELETE' }),
    },

    // ============ PROCESSES ============
    processes: {
        list: () => request<any[]>('/process-blocks'),
        create: (data: any) =>
            request<any>('/process-blocks', { method: 'POST', body: JSON.stringify(data) }),
        updateItem: (id: string, data: any) =>
            request<any>(`/process-blocks/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        diagnosis: () => request<any>('/process-blocks/diagnosis'),
    },

    // ============ KPIs ============
    kpis: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any[]>(`/kpis${query}`);
        },
        create: (data: any) =>
            request<any>('/kpis', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            request<any>(`/kpis/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<any>(`/kpis/${id}`, { method: 'DELETE' }),
    },

    // ============ FINANCIAL ============
    financial: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any[]>(`/financial${query}`);
        },
        summary: () => request<any>('/financial/summary'),
        create: (data: any) =>
            request<any>('/financial', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            request<any>(`/financial/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<any>(`/financial/${id}`, { method: 'DELETE' }),
    },

    // ============ PEOPLE ============
    people: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any[]>(`/people${query}`);
        },
        summary: () => request<any>('/people/summary'),
        create: (data: any) =>
            request<any>('/people', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) =>
            request<any>(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<any>(`/people/${id}`, { method: 'DELETE' }),
    },

    // ============ ALERTS ============
    alerts: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<any[]>(`/alerts${query}`);
        },
        create: (data: any) =>
            request<any>('/alerts', { method: 'POST', body: JSON.stringify(data) }),
        resolve: (id: string) =>
            request<any>(`/alerts/${id}/resolve`, { method: 'PATCH' }),
        dismiss: (id: string) =>
            request<any>(`/alerts/${id}/dismiss`, { method: 'PATCH' }),
        delete: (id: string) =>
            request<any>(`/alerts/${id}`, { method: 'DELETE' }),
    },

    // ============ COMPANY ============
    company: {
        get: () => request<any>('/company'),
        update: (data: any) =>
            request<any>('/company', { method: 'PUT', body: JSON.stringify(data) }),
        users: () => request<any[]>('/company/users'),
    },

    // ============ OPERATIONS ============
    operations: {
        metrics: () => request<any>('/operations/metrics'),
    },
};

export default api;
