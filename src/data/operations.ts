export interface FlowStage {
    id: string;
    name: string;
    volume: number; // Items currently in stage
    capacity: number; // Max capacity before bottleneck
    sla: number; // Target days
    avgTime: number; // Actual avg days
    value: number; // Value in pipeline
}

export interface OperationData {
    flowName: string;
    totalActive: number;
    completedPeriod: number;
    avgCycleTime: number; // Total days
    slaCompliance: number; // %
    stages: FlowStage[];
    bottlenecks: string[]; // Stage IDs
    delayedItems: number;
    reworkRate: number; // %
    valueProcessing: number;
}

// Simulated Case: "Operação sob Pressão" (Sales Flow)
// High volume entering, stuck in "Negotiation/Proposal", High SLA breach risk.
export const OPERATION_DATA: OperationData = {
    flowName: 'Funil de Vendas B2B',
    totalActive: 142,
    completedPeriod: 28,
    avgCycleTime: 45, // Target is likely 30
    slaCompliance: 62, // Low
    delayedItems: 35,
    reworkRate: 12.5,
    valueProcessing: 850000,
    bottlenecks: ['negotiation'],
    stages: [
        {
            id: 'prospect',
            name: 'Prospecção / Lead',
            volume: 45,
            capacity: 100,
            sla: 2,
            avgTime: 1.5,
            value: 0
        },
        {
            id: 'qualify',
            name: 'Qualificação',
            volume: 38,
            capacity: 40,
            sla: 3,
            avgTime: 4.2, // Slight delay
            value: 0
        },
        {
            id: 'proposal',
            name: 'Envio de Proposta',
            volume: 12,
            capacity: 30,
            sla: 5,
            avgTime: 3.0,
            value: 120000
        },
        {
            id: 'negotiation',
            name: 'Negociação',
            volume: 42, // BOTTLENECK: High volume vs others
            capacity: 25, // Over capacity
            sla: 10,
            avgTime: 22.0, // Major delay
            value: 650000
        },
        {
            id: 'closing',
            name: 'Fechamento / Contrato',
            volume: 5,
            capacity: 20,
            sla: 5,
            avgTime: 14.0, // Delay due to backlog?
            value: 80000
        }
    ]
};
