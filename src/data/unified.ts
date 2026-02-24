export type ItemType = 'lead' | 'deal' | 'order' | 'project' | 'ticket' | 'task';
export type FlowType = 'sales' | 'service' | 'project' | 'financial';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Client {
    id: string;
    name: string;
    type: 'PF' | 'PJ';
    segment?: string;
    status: 'active' | 'inactive' | 'prospect';
    email: string;
    phone: string;
    totalValue?: number;
}

export interface FlowStage {
    id: string;
    name: string;
    order: number;
    sla: number; // hours or days
    type: 'start' | 'process' | 'end_success' | 'end_fail';
}

export interface OperatingFlow {
    id: string;
    name: string;
    type: FlowType;
    stages: FlowStage[];
}

export interface OperatingItem {
    id: string;
    title: string;
    type: ItemType;
    flowId: string;
    stageId: string;
    clientId?: string;
    clientName?: string;
    value?: number;
    responsibleId?: string;
    responsibleName?: string;
    createdAt: string;
    updatedAt: string;
    slaDueAt?: string;
    priority: Priority;
    status: 'active' | 'paused' | 'completed' | 'canceled';
}

// SIMULATED DATA (Deprecated - use API)

export const MOCK_CLIENTS: Client[] = [];
export const SALES_FLOW: OperatingFlow = { id: '', name: '', type: 'sales', stages: [] };
export const PROJECT_FLOW: OperatingFlow = { id: '', name: '', type: 'project', stages: [] };
export const MOCK_ITEMS: OperatingItem[] = [];
