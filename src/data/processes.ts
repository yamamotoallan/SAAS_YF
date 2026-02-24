export type ProcessStatus = 'none' | 'informal' | 'formal';
export type BlockType = 'direction' | 'finance' | 'admin' | 'people' | 'ops' | 'governance';

export interface ProcessItem {
    id: string;
    code: string;
    name: string;
    status: ProcessStatus;
    responsible: boolean;
    frequency: 'never' | 'eventual' | 'periodic';
    observation?: string;
}

export interface ProcessBlock {
    id: BlockType;
    title: string;
    processes: ProcessItem[];
}

// Simulated Case: "Empresa em Transição"
// Strong Ops/Admin, Weak Strategy/Governance
export const INITIAL_PROCESS_DATA: ProcessBlock[] = [
    {
        id: 'direction',
        title: '1. Direção & Estratégia',
        processes: [
            { id: 'd01', code: 'D01', name: 'Definição de objetivos estratégicos', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'd02', code: 'D02', name: 'Planejamento anual', status: 'none', responsible: false, frequency: 'never' },
            { id: 'd03', code: 'D03', name: 'Desdobramento de metas', status: 'none', responsible: false, frequency: 'never' },
            { id: 'd04', code: 'D04', name: 'Acompanhamento estratégico', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'd05', code: 'D05', name: 'Tomada de decisão executiva', status: 'informal', responsible: true, frequency: 'eventual' },
        ]
    },
    {
        id: 'finance',
        title: '2. Financeiro',
        processes: [
            { id: 'f01', code: 'F01', name: 'Controle de receitas', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'f02', code: 'F02', name: 'Controle de despesas', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'f03', code: 'F03', name: 'Fluxo de caixa', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'f04', code: 'F04', name: 'Apuração de resultados', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'f05', code: 'F05', name: 'Planejamento financeiro', status: 'none', responsible: false, frequency: 'never' },
        ]
    },
    {
        id: 'admin',
        title: '3. Administrativo',
        processes: [
            { id: 'a01', code: 'A01', name: 'Organização documental', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'a02', code: 'A02', name: 'Rotinas administrativas', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'a03', code: 'A03', name: 'Gestão de contratos', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'a04', code: 'A04', name: 'Gestão de fornecedores', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'a05', code: 'A05', name: 'Controles internos', status: 'informal', responsible: true, frequency: 'periodic' },
        ]
    },
    {
        id: 'people',
        title: '4. Pessoas & RH',
        processes: [
            { id: 'p01', code: 'P01', name: 'Recrutamento e seleção', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'p02', code: 'P02', name: 'Integração (onboarding)', status: 'none', responsible: false, frequency: 'never' },
            { id: 'p03', code: 'P03', name: 'Definição de funções', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'p04', code: 'P04', name: 'Avaliação de desempenho', status: 'none', responsible: false, frequency: 'never' },
            { id: 'p05', code: 'P05', name: 'Gestão de clima organizacional', status: 'none', responsible: false, frequency: 'never' },
        ]
    },
    {
        id: 'ops',
        title: '5. Operacional',
        processes: [
            { id: 'o01', code: 'O01', name: 'Planejamento das atividades', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'o02', code: 'O02', name: 'Execução das rotinas', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'o03', code: 'O03', name: 'Controle de prazos', status: 'formal', responsible: true, frequency: 'periodic' },
            { id: 'o04', code: 'O04', name: 'Controle de qualidade', status: 'informal', responsible: true, frequency: 'periodic' },
            { id: 'o05', code: 'O05', name: 'Melhoria contínua', status: 'none', responsible: false, frequency: 'never' },
        ]
    },
    {
        id: 'governance',
        title: '6. Controle & Governança',
        processes: [
            { id: 'g01', code: 'G01', name: 'Monitoramento de indicadores', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'g02', code: 'G02', name: 'Reuniões de acompanhamento', status: 'informal', responsible: true, frequency: 'eventual' },
            { id: 'g03', code: 'G03', name: 'Registro de decisões', status: 'none', responsible: false, frequency: 'never' },
            { id: 'g04', code: 'G04', name: 'Gestão de riscos', status: 'none', responsible: false, frequency: 'never' },
            { id: 'g05', code: 'G05', name: 'Compliance básico', status: 'formal', responsible: true, frequency: 'periodic' },
        ]
    }
];
