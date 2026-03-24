export type UserRole = 'admin' | 'manager' | 'viewer' | 'user';

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    companyId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Company {
    id: string;
    name: string;
    cnpj?: string;
    segment?: string;
    size?: string;
    revenue?: number;
    headcount?: number;
    logoUrl?: string;
    primaryColor?: string;
    financialTargets?: {
        revenue?: number;
        margin?: number;
        pipeline?: number;
        expenses?: number;
        headcount?: number;
    };
    settings?: {
        sla?: number;
        okrPeriod?: string;
        size?: string;
        alertThresholds?: {
            margin?: number;
            turnover?: number;
            kpi?: number;
            inactivityDays?: number;
        };
    };
    createdAt: string;
    updatedAt: string;
}

export interface Client {
    id: string;
    name: string;
    type: 'PF' | 'PJ';
    email?: string;
    phone?: string;
    segment?: string;
    status: 'active' | 'inactive' | 'prospect';
    totalValue: number;
    companyId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        items: number;
    };
}

export interface OperatingFlow {
    id: string;
    name: string;
    description?: string;
    type: 'sales' | 'service' | 'project' | 'financial';
    companyId: string;
    createdAt: string;
    updatedAt: string;
    stages?: FlowStage[];
    items?: OperatingItem[];
}

export interface FlowStage {
    id: string;
    name: string;
    order: number;
    sla: number;
    type: 'start' | 'process' | 'end_success' | 'end_fail';
    flowId: string;
}

export interface OperatingItem {
    id: string;
    title: string;
    description?: string;
    type: 'lead' | 'deal' | 'order' | 'project' | 'ticket' | 'task';
    value?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'paused' | 'completed' | 'canceled' | 'won' | 'lost';
    slaDueAt?: string;
    closedAt?: string;
    createdAt: string;
    updatedAt: string;
    flowId: string;
    stageId: string;
    clientId?: string;
    responsibleId?: string;
    client?: Client;
    stage?: FlowStage;
    history?: ItemHistory[];
}

export interface ItemHistory {
    id: string;
    action: string;
    fromStage?: string;
    toStage?: string;
    note?: string;
    createdAt: string;
    itemId: string;
}

export interface ProcessBlock {
    id: string;
    name: string;
    type: 'direction' | 'finance' | 'admin' | 'people' | 'ops' | 'governance';
    order: number;
    companyId: string;
    createdAt: string;
    updatedAt: string;
    processes?: ProcessItem[];
}

export interface ProcessItem {
    id: string;
    code: string;
    name: string;
    status: 'none' | 'informal' | 'formal';
    responsible: boolean;
    frequency: 'never' | 'eventual' | 'periodic';
    observation?: string;
    blockId: string;
    createdAt: string;
    updatedAt: string;
}

export interface KPI {
    id: string;
    name: string;
    category: string;
    value: number;
    target: number;
    unit: string;
    trend?: 'up' | 'down' | 'stable';
    status: 'success' | 'warning' | 'danger';
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinancialEntry {
    id: string;
    type: 'revenue' | 'cost' | 'investment' | 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    value: number;
    date: string;
    recurring: boolean;
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Person {
    id: string;
    name: string;
    role: string;
    department: string;
    email?: string;
    phone?: string;
    hireDate: string;
    admissionDate?: string;
    status: 'active' | 'inactive' | 'vacation';
    salary?: number;
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Alert {
    id: string;
    title: string;
    description: string;
    type: 'financial' | 'operational' | 'people' | 'strategic' | 'system' | 'kpi';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved' | 'dismissed';
    createdAt: string;
    resolvedAt?: string;
    companyId: string;
    userId?: string;
}

export interface ActivityLog {
    id: string;
    action: string;
    module: string;
    entityId: string;
    entityName: string;
    details?: string;
    createdAt: string;
    companyId: string;
    userId?: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

export interface Goal {
    id: string;
    title: string;
    description?: string;
    type: 'company' | 'department' | 'individual';
    period: string;
    status: 'draft' | 'active' | 'archived';
    progress: number;
    companyId: string;
    ownerId?: string;
    keyResults?: KeyResult[];
    createdAt: string;
    updatedAt: string;
}

export interface KeyResult {
    id: string;
    title: string;
    initialValue: number;
    currentValue: number;
    targetValue: number;
    unit: string;
    linkedIndicator?: string;
    goalId: string;
    createdAt: string;
    updatedAt: string;
}

export interface BusinessRule {
    id: string;
    name: string;
    description?: string;
    entity: string;
    metric: string;
    operator: string;
    value: number;
    actionType: string;
    priority: string;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductivityStat {
    name: string;
    completed: number;
    active: number;
}

export interface ItemRisk {
    id: string;
    title: string;
    timeInStage: number;
    riskLevel: 'low' | 'medium' | 'critical';
    responsible: string;
}

export interface StageMetric {
    id: string;
    name: string;
    volume: number;
    capacity: number;
    sla: number;
    avgTime: number;
    value: number;
    isBottleneck: boolean;
}

export interface FlowMetric {
    flowId: string;
    flowName: string;
    flowType: string;
    totalActive: number;
    completedPeriod: number;
    avgCycleTime: number;
    slaCompliance: number;
    stages: StageMetric[];
    bottlenecks: string[];
    delayedItems: number;
    itemRisks: ItemRisk[];
    valueProcessing: number;
}

export interface OperationsMetrics {
    flows: FlowMetric[];
    productivityRanking: ProductivityStat[];
    overall: {
        totalActive: number;
        avgSlaCompliance: number;
        totalBottlenecks: number;
        status: string;
        statusClass: 'success' | 'warning' | 'danger';
    };
}
