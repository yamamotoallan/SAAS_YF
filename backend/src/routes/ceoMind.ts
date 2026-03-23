import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { cache } from '../lib/cache';
import { AggregationService } from '../services/AggregationService';

const router = Router();

// GET /api/ceo-mind
router.get('/', async (req: AuthRequest, res) => {
    try {
        const companyId = req.companyId as string;
        const cacheKey = `ceo_mind_${companyId}`;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID não identificado' });
        }

        const forceRefresh = req.query.refresh === 'true';
        const cachedContent = cache.get(cacheKey);
        if (cachedContent && !forceRefresh) {
            return res.json(cachedContent);
        }

        const data = await AggregationService.getCompanyMetrics(companyId);
        const { raw, metrics } = data;

        const targets = ((raw.company?.financialTargets) || {}) as any;
        const targetRevenue = targets?.revenue || 0;
        const targetMargin = targets?.margin || 0;

        const departments = [...new Set(raw.allPeople.map((p: any) => p.department).filter(Boolean))];
        const deptDistribution = departments.map((dept: any) => ({
            name: dept,
            count: raw.allPeople.filter((p: any) => p.department === dept && p.status === 'active').length
        })).sort((a: any, b: any) => b.count - a.count);

        const activeGoals = raw.goals.filter((g: any) => g.status === 'active');
        const avgGoalProgress = activeGoals.length > 0 ? Math.round(activeGoals.reduce((s: any, g: any) => s + g.progress, 0) / activeGoals.length) : 0;
        const goalsAtRisk = activeGoals.filter((g: any) => g.progress < 40).length;

        const risks: any[] = [];
        const opportunities: any[] = [];

        if (metrics.runway < 3) risks.push({ type: 'financial', severity: 'critical', title: 'Runway Crítico', description: `Apenas ${metrics.runway} meses de caixa disponível.`, link: '/financeiro' });
        if (metrics.margin < 10) risks.push({ type: 'financial', severity: 'high', title: 'Margem Operacional Baixa', description: `Margem atual de ${Math.round(metrics.margin)}% está abaixo do mínimo saudável.`, link: '/financeiro' });
        if (metrics.turnover > 5) risks.push({ type: 'people', severity: 'high', title: 'Turnover Elevado', description: `Taxa de ${metrics.turnover}% acima do ideal (≤5%).`, link: '/pessoas' });
        if (metrics.processScore < 50) risks.push({ type: 'process', severity: 'medium', title: 'Maturidade de Processos Baixa', description: `Score de ${metrics.processScore}% indica processos informais.`, link: '/processos' });
        if (raw.lateItems.length > 0) risks.push({ type: 'operational', severity: 'high', title: `${raw.lateItems.length} Itens com SLA Vencido`, description: 'Itens operacionais ultrapassaram o prazo de entrega.', link: '/fluxos' });
        if (raw.stagnantItems.length > 0) risks.push({ type: 'commercial', severity: 'medium', title: `${raw.stagnantItems.length} Oportunidades Estagnadas`, description: 'Itens sem movimentação há mais de 7 dias.', link: '/fluxos' });

        const churnThreats = raw.vips.filter((c: any) => c.items[0] && c.items[0].updatedAt < raw.thirtyDaysAgo);
        if (churnThreats.length > 0) risks.push({ type: 'client', severity: 'high', title: `${churnThreats.length} Clientes VIP em Risco de Churn`, description: 'Clientes de alto valor sem interação há 30+ dias.', link: '/clientes' });

        if (metrics.pipelineValue > metrics.revenue * 2) opportunities.push({ type: 'commercial', title: 'Pipeline Robusto', description: `Pipeline de ${metrics.pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — ${(metrics.pipelineValue / (metrics.revenue || 1)).toFixed(1)}x a receita mensal.` });
        if (metrics.revenueTrend > 10) opportunities.push({ type: 'growth', title: 'Receita em Crescimento', description: `Crescimento de ${Math.round(metrics.revenueTrend)}% vs mês anterior.` });
        if (metrics.processScore >= 70) opportunities.push({ type: 'efficiency', title: 'Processos Maduros', description: `Maturidade de ${metrics.processScore}% permite escalar operações.` });
        if (activeGoals.length > 0 && avgGoalProgress >= 70) opportunities.push({ type: 'strategy', title: 'Metas no Caminho', description: `Progresso médio de ${avgGoalProgress}% nas metas ativas.` });

        const pillars = [
            {
                name: 'Financeiro', score: Math.round(metrics.financialScore), trend: metrics.revenueTrend > 0 ? 'up' : metrics.revenueTrend < 0 ? 'down' : 'stable',
                recommendation: metrics.margin < 10 ? 'Revisar estrutura de custos urgentemente.' : metrics.margin < 20 ? 'Otimizar mix de receita para expandir margens.' : 'Manter disciplina financeira e explorar investimentos.'
            },
            {
                name: 'Pessoas', score: metrics.peopleScore, trend: metrics.turnover > 5 ? 'down' : 'up',
                recommendation: metrics.turnover > 10 ? 'Programas de retenção urgentes.' : metrics.turnover > 5 ? 'Monitorar clima e engajamento.' : 'Investir em desenvolvimento e cultura.'
            },
            {
                name: 'Processos', score: metrics.processScore, trend: metrics.processScore > 50 ? 'up' : 'down',
                recommendation: metrics.processScore < 30 ? 'Priorizar formalização de processos críticos.' : metrics.processScore < 60 ? 'Padronizar e documentar processos-chave.' : 'Automatizar fluxos maduros para ganhar escala.'
            },
            {
                name: 'Comercial', score: metrics.activeItems > 0 ? Math.min(100, Math.round((metrics.pipelineValue / (targetRevenue || metrics.revenue || 1)) * 50)) : 30, trend: metrics.pipelineValue > metrics.revenue ? 'up' : 'down',
                recommendation: metrics.activeItems === 0 ? 'Ativar pipeline de vendas imediatamente.' : metrics.pipelineValue < metrics.revenue * 2 ? 'Aumentar geração de leads — pipeline insuficiente.' : 'Pipeline saudável — focar em conversão.'
            },
            {
                name: 'Estratégia', score: Math.round(metrics.sgeScore), trend: metrics.sgeScore >= 70 ? 'up' : metrics.sgeScore >= 50 ? 'stable' : 'down',
                recommendation: metrics.sgeScore < 50 ? 'Empresa em risco — plano de ação urgente.' : metrics.sgeScore < 70 ? 'Alinhar equipe em torno de 2-3 prioridades.' : 'Estratégia sólida — refinar execução.'
            }
        ];

        const heatmap = {
            'Operações': { Gente: Math.min(100, metrics.peopleScore + 5), Processo: metrics.processScore, Resultado: metrics.activeItems > 0 ? 72 : 40 },
            'Financeiro': { Gente: 90, Processo: Math.min(100, metrics.processScore + 5), Resultado: Math.round(metrics.margin) },
            'RH': { Gente: metrics.climatePercent, Processo: 80, Resultado: metrics.turnover < 5 ? 85 : 60 },
            'Comercial': { Gente: 70, Processo: 65, Resultado: metrics.activeItems > 0 ? 85 : 50 },
            'Produção': { Gente: 80, Processo: Math.min(100, metrics.processScore + 10), Resultado: 70 }
        };

        const decisions: any[] = [];
        if (metrics.margin < 10) decisions.push({ priority: 'critical', action: 'Revisar estrutura de custos', impact: 'Alto', category: 'Financeiro', link: '/financeiro' });
        if (metrics.turnover > 5) decisions.push({ priority: 'high', action: 'Implementar programa de retenção', impact: 'Alto', category: 'Pessoas', link: '/pessoas' });
        if (metrics.processScore < 50) decisions.push({ priority: 'high', action: 'Formalizar processos críticos', impact: 'Médio', category: 'Processos', link: '/processos' });
        if (goalsAtRisk > 0) decisions.push({ priority: 'high', action: `Replanejar ${goalsAtRisk} meta(s) em risco`, impact: 'Alto', category: 'Estratégia', link: '/metas' });
        if (raw.lateItems.length > 3) decisions.push({ priority: 'medium', action: 'Desbloquear itens com SLA vencido', impact: 'Médio', category: 'Operações', link: '/fluxos' });
        if (churnThreats.length > 0) decisions.push({ priority: 'high', action: `Reativar ${churnThreats.length} clientes VIP`, impact: 'Alto', category: 'Comercial', link: '/clientes' });
        if (metrics.runway < 6 && metrics.runway >= 3) decisions.push({ priority: 'medium', action: 'Planejar captação ou redução de custos', impact: 'Alto', category: 'Financeiro', link: '/financeiro' });

        const kpiSummary = raw.kpis.map((k: any) => ({
            name: k.name, value: k.value, target: k.target, unit: k.unit, status: k.status,
            progress: k.target > 0 ? Math.round((k.value / k.target) * 100) : 0
        }));

        const ceoMindData = {
            companyName: raw.company?.name || 'Empresa',
            companySegment: raw.company?.segment || '',
            timestamp: new Date().toISOString(),

            pulse: {
                sgeScore: metrics.sgeScore,
                sgeStatus: metrics.sgeScore < 50 ? 'Empresa em Risco' : metrics.sgeScore < 75 ? 'Empresa em Transição' : 'Empresa Saudável',
                revenue: metrics.revenue,
                costs: metrics.costs,
                margin: Math.round(metrics.margin),
                revenueTrend: Math.round(metrics.revenueTrend),
                headcount: metrics.headcount,
                activeItems: metrics.activeItems,
                pipelineValue: metrics.pipelineValue,
                runway: metrics.runway,
                activeAlerts: raw.activeAlerts.length,
                activeGoals: activeGoals.length,
                avgGoalProgress,
                totalClients: raw.allClients,
                recentActivity: raw.recentLogs,
            },

            pillars,
            risks: risks.sort((a, b) => {
                const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                return (order[a.severity] || 3) - (order[b.severity] || 3);
            }).slice(0, 7),
            opportunities: opportunities.slice(0, 5),
            decisions: decisions.slice(0, 7),

            financial: {
                revenue: metrics.revenue,
                costs: metrics.costs,
                profit: metrics.revenue - metrics.costs,
                margin: Math.round(metrics.margin),
                cashAvailable: metrics.cashAvailable,
                runway: metrics.runway,
                targetRevenue,
                targetMargin,
                burnRate: Math.round(metrics.recentBurnRate),
                history: metrics.historicalFinancials,
                revenueTrend: Math.round(metrics.revenueTrend),
            },

            people: {
                headcount: metrics.headcount,
                turnover: metrics.turnover,
                climateScore: Math.round(metrics.climatePercent),
                departments: deptDistribution.slice(0, 8),
                totalPeople: raw.allPeople.length,
            },

            goals: activeGoals.map((g: any) => ({
                id: g.id, title: g.title, type: g.type, period: g.period, progress: g.progress,
                keyResults: (g.keyResults || []).map((kr: any) => ({
                    title: kr.title, current: kr.currentValue, target: kr.targetValue, unit: kr.unit,
                    progress: kr.targetValue > 0 ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0
                }))
            })),

            kpis: kpiSummary,
            heatmap,
            alerts: raw.activeAlerts.map((a: any) => ({
                id: a.id, title: a.title, description: a.description, type: a.type, priority: a.priority, createdAt: a.createdAt,
            })),
        };

        cache.set(cacheKey, ceoMindData);
        res.json(ceoMindData);
    } catch (err) {
        console.error('[CeoMind Error]:', err);
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: `Erro ao carregar Mente de CEO: ${msg.substring(0, 150)}` });
    }
});

export default router;
