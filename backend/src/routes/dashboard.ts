import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { cache } from '../lib/cache';
import { AggregationService } from '../services/AggregationService';

const router = Router();

// GET /api/dashboard
router.get('/', async (req: AuthRequest, res) => {
    try {
        const companyId = req.companyId as string;
        const cacheKey = `dashboard_${companyId}`;

        if (!companyId) {
            console.error('[Dashboard] Missing companyId in request');
            return res.status(400).json({ error: 'Company ID não identificado' });
        }

        const forceRefresh = req.query.refresh === 'true';
        const cachedContent = cache.get(cacheKey);
        if (cachedContent && !forceRefresh) {
            console.log(`[Dashboard] Serving from cache for company: ${companyId}`);
            return res.json(cachedContent);
        }

        const data = await AggregationService.getCompanyMetrics(companyId);
        const { raw, metrics } = data;

        // Dashboard specific logic: priority actions, heatmap, spider, bottlenecks
        const priorityActions: any[] = [];
        if (metrics.runway < 3) priorityActions.push({ type: 'financial', priority: 'critical', text: 'Baixo Caixa (Runway < 3 meses)', meta: 'Financeiro • Urgente', link: '/financeiro' });
        if (metrics.margin < 10) priorityActions.push({ type: 'financial', priority: 'high', text: 'Margem Operacional Crítica (<10%)', meta: 'Financeiro • Revisar Custos', link: '/financeiro' });

        if (metrics.recentBurnRate > 0 && metrics.recentBurnRate > (metrics.costs * 1.25)) {
             priorityActions.push({ type: 'financial', priority: 'high', text: 'Aceleração de Gastos Detectada', meta: `Crescimento nos custos`, link: '/financeiro' });
        }

        const hasHighValue = raw.flows.some((f: any) => f.items.some((i: any) => Number(i.value || 0) > 50000));
        if (hasHighValue) priorityActions.push({ type: 'operational', priority: 'medium', text: 'Oportunidades de alto valor detectadas', meta: 'Fluxos • Acompanhar', link: '/fluxos' });

        if (metrics.turnover > 5) priorityActions.push({ type: 'people', priority: 'high', text: 'Turnover acima do ideal (>5%)', meta: 'Pessoas • Retenção', link: '/pessoas' });
        if (metrics.processScore < 50) priorityActions.push({ type: 'process', priority: 'medium', text: 'Baixa Maturidade de Processos', meta: 'Processos • Padronizar', link: '/processos' });

        raw.activeAlerts.forEach((alert: any) => {
            priorityActions.push({ type: 'alert', priority: alert.priority === 'critical' ? 'critical' : 'high', text: alert.title, meta: 'Alerta • Manual', link: '/alertas' });
        });

        if (raw.stagnantItems.length > 0) {
            priorityActions.push({ type: 'commercial', priority: 'high', text: `${raw.stagnantItems.length} oportunidades estagnadas há +7 dias`, meta: 'Comercial • Reativar Leads', link: '/fluxos' });
        }

        const revenueGoal = raw.goals.find((g: any) => g.title.toLowerCase().includes('receita'));
        const goalTarget = revenueGoal?.keyResults[0]?.targetValue || 0;
        if (revenueGoal && goalTarget > 0 && metrics.pipelineValue < goalTarget * 2) {
            priorityActions.push({ type: 'commercial', priority: 'critical', text: 'Pipeline insuficiente para bater meta (Saúde < 50%)', meta: 'Comercial • Urgente', link: '/fluxos' });
        }

        const churnThreats = raw.vips.filter((c: any) => c.items[0] && c.items[0].updatedAt < raw.thirtyDaysAgo);
        if (churnThreats.length > 0) {
            priorityActions.push({ type: 'client', priority: 'high', text: `${churnThreats.length} clientes VIP com risco de Churn`, meta: 'CS • Inatividade > 30 dias', link: '/clientes' });
        }

        const criticalBottlenecks = raw.flows.filter((f: any) => {
            const totalItems = f.items.length;
            const avgCapacity = Math.max(10, Math.ceil(totalItems / f.stages.length) * 1.5);
            return f.stages.some((s: any) => f.items.filter((i: any) => i.stageId === s.id && i.status === 'active').length > avgCapacity);
        });
        if (criticalBottlenecks.length > 0) {
            priorityActions.push({ type: 'operational', priority: 'high', text: `Gargalo em ${criticalBottlenecks.length} fluxos operacionais`, meta: 'Operação • Reveja capacidades', link: '/operacao' });
        }

        const allActiveItems = raw.flows.flatMap((f: any) => f.items).filter((i: any) => i.status === 'active');
        const userLoad: Record<string, number> = {};
        allActiveItems.forEach((i: any) => { if (i.responsibleId) userLoad[i.responsibleId] = (userLoad[i.responsibleId] || 0) + 1; });
        const overloadedUsers = Object.values(userLoad).filter(count => count > 15).length;
        if (overloadedUsers > 0) {
            priorityActions.push({ type: 'people', priority: 'medium', text: `${overloadedUsers} colaboradores com sobrecarga de itens`, meta: 'Pessoas • Redistribuir carga', link: '/operacao' });
        }

        const flowToProcessMap: Record<string, string> = { 'sales': 'ops', 'service': 'ops', 'project': 'ops', 'financial': 'finance', 'human_resources': 'people' };
        const bottlenecks = raw.processBlocks.map((block: any) => {
            const friction = raw.lateItems.filter((item: any) => flowToProcessMap[item.flow.type] === block.type).length;
            return { name: block.name, friction, score: 0 };
        }).filter((b: any) => b.friction > 0).sort((a: any, b: any) => b.friction - a.friction).slice(0, 3);

        const dashboardData = {
            sgeScore: metrics.sgeScore,
            sgeStatus: metrics.sgeScore < 50 ? 'Empresa em Risco' : metrics.sgeScore < 75 ? 'Empresa em Transição' : 'Empresa Saudável',
            financial: {
                revenue: metrics.revenue,
                costs: metrics.costs,
                margin: Math.round(metrics.margin),
                cashAvailable: metrics.cashAvailable,
                operatingMonths: metrics.runway,
                history: metrics.historicalFinancials
            },
            people: { headcount: metrics.headcount, turnover: metrics.turnover, climateScore: metrics.climateScore, burnRate: metrics.recentBurnRate },
            pipeline: { value: metrics.pipelineValue, activeItems: metrics.activeItems },
            processMaturity: { score: metrics.processScore, status: metrics.processScore >= 70 ? 'Saudável' : metrics.processScore >= 40 ? 'Transição' : 'Risco' },
            actions: priorityActions.slice(0, 5),
            alerts: raw.activeAlerts,
            flows: raw.flows.map((f: any) => ({ id: f.id, name: f.name, activeItems: f.items.length, totalValue: f.items.reduce((s: any, i: any) => s + Number(i.value || 0), 0) })),
            heatmap: {
                'Ops': { Gente: 85, Processo: metrics.processScore, Resultado: 72 },
                'Fin': { Gente: 90, Processo: metrics.processScore + 5, Resultado: Math.round(metrics.margin) },
                'RH': { Gente: metrics.peopleScore, Processo: 80, Resultado: 75 },
                'Com': { Gente: 70, Processo: 65, Resultado: metrics.activeItems > 0 ? 85 : 50 },
                'Prod': { Gente: 80, Processo: 85, Resultado: 70 }
            },
            spider: {
                'Financeiro': Math.round(metrics.margin),
                'Pessoas': metrics.peopleScore,
                'Processos': metrics.processScore,
                'Estratégia': metrics.sgeScore,
                'Comercial': metrics.activeItems > 0 ? 80 : 40
            },
            bottlenecks,
            goals: raw.goals
        };

        cache.set(cacheKey, dashboardData);
        res.json(dashboardData);
    } catch (err) {
        console.error('[Dashboard Error]:', err);
        const errorMessage = err instanceof Error ? err.stack || err.message : String(err);
        res.status(500).json({ error: `Erro: ${errorMessage.substring(0, 150)}`, details: errorMessage });
    }
});

export default router;
