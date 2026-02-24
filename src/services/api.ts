/// <reference types="vite/client" />
import type {
    User, Client, OperatingFlow, FlowStage, OperatingItem,
    ProcessBlock, ProcessItem, KPI, FinancialEntry, Person, Alert,
    ActivityLog, Goal, KeyResult, BusinessRule, Company, PaginatedResponse
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://saasyf-production.up.railway.app/api';

// Token management
export const getToken = (): string | null => localStorage.getItem('yf_token');
export const setToken = (token: string): void => localStorage.setItem('yf_token', token);
export const removeToken = (): void => localStorage.removeItem('yf_token');

export const getUser = (): any => {
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
        if (typeof window !== 'undefined') window.location.href = '/login';
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
            request<{ token: string; user: User }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }),
        register: (data: Partial<User> & { companyName: string }) =>
            request<{ token: string; user: User }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        forgotPassword: (email: string) =>
            request<{ message: string }>('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            }),
        resetPassword: (data: any) =>
            request<{ message: string }>('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        me: () => request<User>('/auth/me'),
    },

    // ============ DASHBOARD ============
    dashboard: {
        get: () => request<any>('/dashboard'), // Dashboard state is complex and aggregated, specialized interface could be added later
    },

    // ============ CLIENTS ============
    clients: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<PaginatedResponse<Client>>(`/clients${query}`);
        },
        get: (id: string) => request<Client>(`/clients/${id}`),
        create: (data: Partial<Client>) =>
            request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<Client>) =>
            request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<{ message: string }>(`/clients/${id}`, { method: 'DELETE' }),
        intelligence: (id: string) =>
            request<{ ltv: number; healthScore: number; churnRisk: string; daysSinceLastActivity: number; metrics: any }>(`/clients/${id}/intelligence`),
    },

    // ============ FLOWS ============
    flows: {
        list: () => request<OperatingFlow[]>('/flows'),
        get: (id: string) => request<OperatingFlow>(`/flows/${id}`),
        analytics: (id: string) => request<any>(`/flows/${id}/analytics`),
        create: (data: Partial<OperatingFlow>) =>
            request<OperatingFlow>('/flows', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<OperatingFlow>) =>
            request<OperatingFlow>(`/flows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<{ message: string }>(`/flows/${id}`, { method: 'DELETE' }),
        addStage: (flowId: string, data: Partial<FlowStage>) =>
            request<FlowStage>(`/flows/${flowId}/stages`, { method: 'POST', body: JSON.stringify(data) }),
    },

    // ============ ITEMS ============
    items: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<OperatingItem[]>(`/items${query}`);
        },
        get: (id: string) => request<OperatingItem>(`/items/${id}`),
        create: (data: Partial<OperatingItem>) =>
            request<OperatingItem>('/items', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<OperatingItem>) =>
            request<OperatingItem>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        move: (id: string, stageId: string) =>
            request<OperatingItem>(`/items/${id}/move`, { method: 'PATCH', body: JSON.stringify({ stageId }) }),
        close: (id: string, status: 'won' | 'lost', lostReason?: string) =>
            request<OperatingItem>(`/items/${id}/close`, { method: 'PATCH', body: JSON.stringify({ status, lostReason }) }),
        delete: (id: string) =>
            request<{ message: string }>(`/items/${id}`, { method: 'DELETE' }),
    },

    // ============ PROCESSES ============
    processes: {
        list: () => request<ProcessBlock[]>('/process-blocks'),
        create: (data: Partial<ProcessBlock>) =>
            request<ProcessBlock>('/process-blocks', { method: 'POST', body: JSON.stringify(data) }),
        updateItem: (id: string, data: Partial<ProcessItem>) =>
            request<ProcessItem>(`/process-blocks/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        diagnosis: () => request<any>('/process-blocks/diagnosis'),
        actions: () => request<any[]>('/process-blocks/actions'),
    },

    // ============ KPIs ============
    kpis: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<KPI[]>(`/kpis${query}`);
        },
        create: (data: Partial<KPI>) =>
            request<KPI>('/kpis', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<KPI>) =>
            request<KPI>(`/kpis/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<{ message: string }>(`/kpis/${id}`, { method: 'DELETE' }),
    },

    // ============ FINANCIAL ============
    financial: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<PaginatedResponse<FinancialEntry>>(`/financial${query}`);
        },
        summary: () => request<any>('/financial/summary'),
        projection: () => request<any[]>('/financial/projection'),
        create: (data: Partial<FinancialEntry>) =>
            request<FinancialEntry>('/financial', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<FinancialEntry>) =>
            request<FinancialEntry>(`/financial/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<{ message: string }>(`/financial/${id}`, { method: 'DELETE' }),
    },

    // ============ PEOPLE ============
    people: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<PaginatedResponse<Person>>(`/people${query}`);
        },
        summary: () => request<any>('/people/summary'),
        create: (data: Partial<Person>) =>
            request<Person>('/people', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<Person>) =>
            request<Person>(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<{ message: string }>(`/people/${id}`, { method: 'DELETE' }),
    },

    // ============ ALERTS ============
    alerts: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<Alert[]>(`/alerts${query}`);
        },
        create: (data: Partial<Alert>) =>
            request<Alert>('/alerts', { method: 'POST', body: JSON.stringify(data) }),
        resolve: (id: string) =>
            request<Alert>(`/alerts/${id}/resolve`, { method: 'PATCH' }),
        dismiss: (id: string) =>
            request<Alert>(`/alerts/${id}/dismiss`, { method: 'PATCH' }),
        delete: (id: string) =>
            request<{ message: string }>(`/alerts/${id}`, { method: 'DELETE' }),
    },

    // ============ COMPANY ============
    company: {
        get: () => request<Company>('/company'),
        update: (data: Partial<Company>) =>
            request<Company>('/company', { method: 'PUT', body: JSON.stringify(data) }),
        users: () => request<Partial<User>[]>('/company/users'),
    },

    // ============ OPERATIONS ============
    operations: {
        metrics: () => request<any>('/operations/metrics'),
    },

    // ============ LOGS ============
    logs: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<PaginatedResponse<ActivityLog>>(`/logs${query}`);
        },
    },

    // ============ GOALS ============
    goals: {
        list: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return request<Goal[]>(`/goals${query}`);
        },
        create: (data: Partial<Goal>) =>
            request<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<Goal>) =>
            request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<{ message: string }>(`/goals/${id}`, { method: 'DELETE' }),
        addKeyResult: (goalId: string, data: Partial<KeyResult>) =>
            request<KeyResult>(`/goals/${goalId}/key-results`, { method: 'POST', body: JSON.stringify(data) }),
        updateKeyResult: (id: string, data: Partial<KeyResult>) =>
            request<KeyResult>(`/goals/key-results/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        sync: () => request<{ message: string }>('/goals/sync', { method: 'POST' }),
    },

    // ============ RULES ============
    rules: {
        list: () => request<BusinessRule[]>('/rules'),
        create: (data: Partial<BusinessRule>) =>
            request<BusinessRule>('/rules', { method: 'POST', body: JSON.stringify(data) }),
        delete: (id: string) =>
            request<{ message: string }>(`/rules/${id}`, { method: 'DELETE' }),
    },
};


export default api;
