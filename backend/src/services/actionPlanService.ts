
// Structure for Action Templates
interface ActionTemplate {
    title: string;
    step: string;
    tool: string;
}

// Default templates (fallback)
const DEFAULT_TEMPLATES: Record<string, ActionTemplate> = {
    'D01': { title: 'Formalizar Planejamento', step: 'Criar documento de visão anual', tool: 'Miro/Word' },
    'D02': { title: 'Definir Orçamento', step: 'Criar planilha de budget mensal', tool: 'Excel/Sheets' },
    'F01': { title: 'Implementar Fluxo de Caixa', step: 'Registrar todas entradas e saídas', tool: 'Sistema ERP' },
    'F05': { title: 'Gestão de Inadimplência', step: 'Definir régua de cobrança', tool: 'CRM/Email' },
    'P01': { title: 'Organizar Onboarding', step: 'Criar checklist de entrada de funcionário', tool: 'Notion' },
    'P04': { title: 'Avaliação de Desempenho', step: 'Rodar ciclo de feedback semestral', tool: 'Forms' },
    'O01': { title: 'Mapear Fluxo de Valor', step: 'Desenhar etapas da entrega principal', tool: 'Bizagi/Mermaid' },
    'O05': { title: 'Controle de Qualidade', step: 'Checklist de entrega final', tool: 'App/Papel' },
    'G01': { title: 'Reunião de Sócios', step: 'Agendar papo mensal de resultados', tool: 'Google Calendar' },
    'G03': { title: 'Acordo de Sócios', step: 'Redigir contrato social/acordo', tool: 'Advogado' }
};

// Segment-specific overrides
const SEGMENT_TEMPLATES: Record<string, Record<string, ActionTemplate>> = {
    'varejo': {
        'F01': { title: 'Frente de Caixa', step: 'Implantar sistema de PDV e fechamento diário', tool: 'Sistema PDV' },
        'O01': { title: 'Gestão de Estoque', step: 'Implementar inventário rotativo', tool: 'Planilha/ERP' },
        'P01': { title: 'Treinamento de Vendas', step: 'Criar manual de atendimento ao cliente', tool: 'Vídeo/PDF' },
        'D01': { title: 'Planejamento de Compras', step: 'Definir calendário de sazonalidade', tool: 'Excel' }
    },
    'serviços': {
        'F01': { title: 'Fluxo de Caixa Projetado', step: 'Controlar contas a receber x pagar', tool: 'ERP' },
        'O01': { title: 'Gestão de Projetos', step: 'Definir etapas padrão de entrega', tool: 'Trello/Jira' },
        'O05': { title: 'NPS e Qualidade', step: 'Rodar pesquisa de satisfação pós-entrega', tool: 'Forms' },
        'D01': { title: 'Capacidade Produtiva', step: 'Calcular horas disponíveis da equipe', tool: 'Excel' }
    },
    'industria': {
        'F01': { title: 'Custeio Industrial', step: 'Mapear custos fixos e variáveis por produto', tool: 'Excel Avançado' },
        'O01': { title: 'PCP (Planejamento)', step: 'Definir ordem de produção semanal', tool: 'ERP Industrial' },
        'O05': { title: 'ISO 9001 / Qualidade', step: 'Escrever procedimentos operacionais padrão (POP)', tool: 'Word' },
        'P01': { title: 'Segurança do Trabalho', step: 'Implementar checklist de EPIs diário', tool: 'App/Papel' }
    },
    'tecnologia': {
        'P01': { title: 'Onboarding Técnico', step: 'Setup de ambiente e acesso aos repositórios', tool: 'Wiki/Notion' },
        'O01': { title: 'Metodologia Ágil', step: 'Implementar Sprints e Dailies', tool: 'Jira/Linear' },
        'O05': { title: 'Code Review', step: 'Definir checklist de PR (Pull Request)', tool: 'GitHub/GitLab' }
    }
};

export class ActionPlanService {
    static getTemplate(code: string, segment?: string | null): ActionTemplate {
        // Normalize segment string (remove accents, lowercase)
        const normalizedSegment = segment?.toLowerCase().trim() || 'geral';

        let foundSegmentKey = 'geral';

        // Simple matching logic
        if (normalizedSegment.includes('varejo') || normalizedSegment.includes('loja') || normalizedSegment.includes('comercio')) {
            foundSegmentKey = 'varejo';
        } else if (normalizedSegment.includes('serviço') || normalizedSegment.includes('consultoria') || normalizedSegment.includes('agencia')) {
            foundSegmentKey = 'serviços';
        } else if (normalizedSegment.includes('industria') || normalizedSegment.includes('fabrica') || normalizedSegment.includes('produção')) {
            foundSegmentKey = 'industria';
        } else if (normalizedSegment.includes('tech') || normalizedSegment.includes('software') || normalizedSegment.includes('ti')) {
            foundSegmentKey = 'tecnologia';
        }

        const segmentDict = SEGMENT_TEMPLATES[foundSegmentKey];
        if (segmentDict && segmentDict[code]) {
            return segmentDict[code];
        }

        // Fallback to default
        return DEFAULT_TEMPLATES[code] || {
            title: 'Melhorar Processo',
            step: 'Mapear e documentar o processo atual',
            tool: 'Documento de Texto'
        };
    }
}
