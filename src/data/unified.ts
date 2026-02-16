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

// SIMULATED DATA

export const MOCK_CLIENTS: Client[] = [
    { id: 'c1', name: 'Tech Solutions Ltda', type: 'PJ', segment: 'Tecnologia', status: 'active', email: 'contato@techsol.com', phone: '(11) 9999-8888', totalValue: 150000 },
    { id: 'c2', name: 'Grupo Varejo S.A.', type: 'PJ', segment: 'Varejo', status: 'active', email: 'compras@grupovarejo.com.br', phone: '(11) 3333-2222', totalValue: 450000 },
    { id: 'c3', name: 'Consultoria Alpha', type: 'PJ', segment: 'Serviços', status: 'prospect', email: 'diretoria@alpha.com', phone: '(21) 9888-7777', totalValue: 0 },
];

export const SALES_FLOW: OperatingFlow = {
    id: 'flow_sales_b2b',
    name: 'Funil de Vendas B2B',
    type: 'sales',
    stages: [
        { id: 's1', name: 'Prospecção', order: 1, sla: 48, type: 'start' },
        { id: 's2', name: 'Qualificação', order: 2, sla: 72, type: 'process' },
        { id: 's3', name: 'Proposta', order: 3, sla: 120, type: 'process' },
        { id: 's4', name: 'Negociação', order: 4, sla: 240, type: 'process' },
        { id: 's5', name: 'Fechado', order: 5, sla: 0, type: 'end_success' },
    ]
};

export const PROJECT_FLOW: OperatingFlow = {
    id: 'flow_proj_impl',
    name: 'Implantação de Sistema',
    type: 'project',
    stages: [
        { id: 'p1', name: 'Planejamento', order: 1, sla: 5, type: 'start' },
        { id: 'p2', name: 'Execução', order: 2, sla: 15, type: 'process' },
        { id: 'p3', name: 'Homologação', order: 3, sla: 5, type: 'process' },
        { id: 'p4', name: 'Treinamento', order: 4, sla: 3, type: 'process' },
        { id: 'p5', name: 'Concluído', order: 5, sla: 0, type: 'end_success' },
    ]
};

export const MOCK_ITEMS: OperatingItem[] = [
    { id: 'i1', title: 'Licença Enterprise - Tech Solutions', type: 'deal', flowId: 'flow_sales_b2b', stageId: 's3', clientId: 'c1', clientName: 'Tech Solutions Ltda', value: 50000, priority: 'high', createdAt: '2026-02-10', updatedAt: '2026-02-15', status: 'active', responsibleName: 'Ana Silva' },
    { id: 'i2', title: 'Consultoria Expansão - Grupo Varejo', type: 'deal', flowId: 'flow_sales_b2b', stageId: 's4', clientId: 'c2', clientName: 'Grupo Varejo S.A.', value: 120000, priority: 'critical', createdAt: '2026-02-01', updatedAt: '2026-02-14', status: 'active', responsibleName: 'Carlos Souza' },
    { id: 'i3', title: 'Projeto Alpha - Onboarding', type: 'lead', flowId: 'flow_sales_b2b', stageId: 's1', clientId: 'c3', clientName: 'Consultoria Alpha', value: 15000, priority: 'medium', createdAt: '2026-02-15', updatedAt: '2026-02-15', status: 'active', responsibleName: 'Ana Silva' },
    { id: 'i4', title: 'Implantação ERP - Unidade SP', type: 'project', flowId: 'flow_proj_impl', stageId: 'p2', clientId: 'c2', clientName: 'Grupo Varejo S.A.', value: 0, priority: 'high', createdAt: '2026-01-15', updatedAt: '2026-02-10', status: 'active', responsibleName: 'Roberto Lima' },
];
