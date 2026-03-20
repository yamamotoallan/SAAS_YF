import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { cache } from '../lib/cache';

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

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const safeQuery = async <T>(name: string, promise: Promise<T>, fallback: T): Promise<T> => {
            try {
                return await promise;
            } catch (err) {
                console.error(`[CeoMind] Query ${name} FAILED:`, err instanceof Error ? err.message : String(err));
                return fallback;
            }
        };

        const [
            monthFinancials,
            allFinancials,
            activePeopleCount,
            allPeople,
            kpis,
            activeItemsData,
            processBlocks,
            activeAlerts,
            flows,
            goals,
            lateItems,
            stagnantItems,
            vips,
            company,
            allClients,
            recentLogs
        ] = await Promise.all([
            safeQuery('monthFinancials', prisma.financialEntry.findMany({
                where: { companyId, date: { gte: startOfMonth, lte: endOfMonth } },
            }), []),
            safeQuery('allFinancials', prisma.financialEntry.findMany({
                where: { companyId, date: { gte: sixMonthsAgo } },
                orderBy: { date: 'asc' }
            }), []),
            safeQuery('activePeople', prisma.person.count({ where: { companyId, status: 'active' } }), 0),
            safeQuery('allPeople', prisma.person.findMany({
                where: { companyId },
                select: { id: true, name: true, role: true, department: true, status: true, salary: true, hireDate: true }
            }), []),
            safeQuery('kpis', prisma.kPI.findMany({ where: { companyId } }), []),
            safeQuery('activeItems', prisma.operatingItem.aggregate({
                where: { flow: { companyId }, status: 'active' },
                _sum: { value: true },
                _count: { id: true },
            }), { _sum: { value: null }, _count: { id: 0 } }),
            safeQuery('processBlocks', prisma.processBlock.findMany({
                where: { companyId },
                include: { processes: true },
            }), []),
            safeQuery('activeAlerts', prisma.alert.findMany({
                where: { companyId, status: 'active' },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            }), []),
            safeQuery('flows', prisma.operatingFlow.findMany({
                where: { companyId },
                include: {
                    items: { where: { status: 'active' } },
                    stages: { orderBy: { order: 'asc' } }
                }
            }), []),
            safeQuery('goals', prisma.goal.findMany({
                where: { companyId },
                include: { keyResults: true },
                orderBy: { createdAt: 'desc' }
            }), []),
            safeQuery('lateItems', prisma.operatingItem.findMany({
                where: { flow: { companyId }, status: 'active', slaDueAt: { lt: now } },
                include: { flow: { select: { name: true, type: true } } }
            }), []),
            safeQuery('stagnantItems', prisma.operatingItem.findMany({
                where: { flow: { companyId }, status: 'active', updatedAt: { lt: sevenDaysAgo } },
            }), []),
            safeQuery('vips', prisma.client.findMany({
                where: { companyId, status: 'active' },
                include: {
                    _count: { select: { items: true } },
                    items: { orderBy: { updatedAt: 'desc' }, take: 1 }
                },
                orderBy: { totalValue: 'desc' },
                take: 20
            }), []),
            safeQuery('company', prisma.company.findUnique({
                where: { id: companyId },
                select: { name: true, segment: true, size: true, revenue: true, headcount: true, financialTargets: true, settings: true }
            }), null),
            safeQuery('allClients', prisma.client.count({ where: { companyId, status: 'active' } }), 0),
            safeQuery('recentLogs', prisma.activityLog.count({
                where: { companyId, createdAt: { gte: sevenDaysAgo } }
            }), 0),
        ]);

        // ── Financial Calculations ──
        const revenue = monthFinancials
            .filter(e => e.type === 'revenue' || e.type === 'INCOME')
            .reduce((s, e) => s + Number(e.value || 0), 0);
        const costs = monthFinancials
            .filter(e => e.type === 'cost' || e.type === 'EXPENSE')
            .reduce((s, e) => s + Number(e.value || 0), 0);
        const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

        // Historical revenue for trend
        const monthlyHistory: { month: string; revenue: number; costs: number; profit: number }[] = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const monthEntries = allFinancials.filter(e => e.date.getMonth() === d.getMonth() && e.date.getFullYear() === d.getFullYear());
            const mRev = monthEntries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
            const mCost = monthEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
            const monthName = d.toLocaleString('pt-BR', { month: 'short' });
            monthlyHistory.push({
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                revenue: mRev,
                costs: mCost,
                profit: mRev - mCost
            });
        }

        // Total cash
        const totalRev = allFinancials.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
        const totalCost = allFinancials.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
        const cashAvailable = totalRev - totalCost;

        // Burn rate (last 3 months)
        const recentExpenses = allFinancials.filter(e => e.date >= threeMonthsAgo && (e.type === 'cost' || e.type === 'EXPENSE'));
        const recentBurnRate = recentExpenses.reduce((s, e) => s + Number(e.value || 0), 0) / 3;
        const runway = recentBurnRate > 0 ? Math.floor(cashAvailable / recentBurnRate) : 0;

        // Financial targets
        const targets = (company?.financialTargets || {}) as any;
        const targetRevenue = targets?.revenue || 0;
        const targetMargin = targets?.margin || 0;

        // Previous month comparison
        const prevMonthData = monthlyHistory.length >= 2 ? monthlyHistory[monthlyHistory.length - 2] : null;
        const revenueTrend = prevMonthData && prevMonthData.revenue > 0
            ? ((revenue - prevMonthData.revenue) / prevMonthData.revenue) * 100 : 0;

        // ── People Calculations ──
        const turnoverKpi = kpis.find(k => k.name.toLowerCase().includes('turnover'));
        const climateKpi = kpis.find(k => k.name.toLowerCase().includes('clima'))
            || kpis.find(k => k.name.toLowerCase().includes('satisfação'));

        const turnover = turnoverKpi ? turnoverKpi.value : 0;
        let climateScore = 75;
        if (climateKpi) {
            climateScore = climateKpi.unit === '%' || climateKpi.value > 10 ? climateKpi.value : (climateKpi.value / 5) * 100;
        }

        const departments = [...new Set(allPeople.map(p => p.department).filter(Boolean))];
        const deptDistribution = departments.map(dept => ({
            name: dept,
            count: allPeople.filter(p => p.department === dept && p.status === 'active').length
        })).sort((a, b) => b.count - a.count);

        // ── Process Maturity ──
        let processScore = 0;
        if (processBlocks.length > 0) {
            const blockScores = processBlocks.map(block => {
                const total = block.processes.length;
                if (total === 0) return 0;
                let points = 0;
                block.processes.forEach(p => {
                    if (p.status === 'formal') points += 3;
                    else if (p.status === 'informal') points += 1;
                    if (p.responsible) points += 1;
                    if (p.frequency === 'periodic') points += 1;
                    else if (p.frequency === 'eventual') points += 0.5;
                });
                return Math.round((points / (total * 5)) * 100);
            });
            processScore = Math.round(blockScores.reduce((s, v) => s + v, 0) / blockScores.length);
        }

        // ── Pipeline ──
        const pipelineValue = Number(activeItemsData._sum.value || 0);
        const activeItems = activeItemsData._count.id;

        // ── SGE Score ──
        const financialScore = Math.max(0, Math.min(100, margin * 2 + (revenue > 0 ? 30 : 0)));
        const turnoverScore = Math.max(0, 100 - (turnover * 2));
        const climatePoints = (climateScore / 100) * 100;
        const peopleScore = Math.round((climatePoints * 0.4) + (turnoverScore * 0.4) + 20);
        const sgeScore = Math.round((financialScore * 0.35 + peopleScore * 0.25 + processScore * 0.25 + (activeItems > 0 ? 80 : 0) * 0.15));

        // ── Goals summary ──
        const activeGoals = goals.filter(g => g.status === 'active');
        const avgGoalProgress = activeGoals.length > 0
            ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length) : 0;
        const goalsAtRisk = activeGoals.filter(g => g.progress < 40).length;

        // ── Risks & Opportunities ──
        const risks: any[] = [];
        const opportunities: any[] = [];

        if (runway < 3) risks.push({ type: 'financial', severity: 'critical', title: 'Runway Crítico', description: `Apenas ${runway} meses de caixa disponível.`, link: '/financeiro' });
        if (margin < 10) risks.push({ type: 'financial', severity: 'high', title: 'Margem Operacional Baixa', description: `Margem atual de ${Math.round(margin)}% está abaixo do mínimo saudável.`, link: '/financeiro' });
        if (turnover > 5) risks.push({ type: 'people', severity: 'high', title: 'Turnover Elevado', description: `Taxa de ${turnover}% acima do ideal (≤5%).`, link: '/pessoas' });
        if (processScore < 50) risks.push({ type: 'process', severity: 'medium', title: 'Maturidade de Processos Baixa', description: `Score de ${processScore}% indica processos informais.`, link: '/processos' });
        if (lateItems.length > 0) risks.push({ type: 'operational', severity: 'high', title: `${lateItems.length} Itens com SLA Vencido`, description: 'Itens operacionais ultrapassaram o prazo de entrega.', link: '/fluxos' });
        if (stagnantItems.length > 0) risks.push({ type: 'commercial', severity: 'medium', title: `${stagnantItems.length} Oportunidades Estagnadas`, description: 'Itens sem movimentação há mais de 7 dias.', link: '/fluxos' });

        const churnThreats = vips.filter(c => {
            const lastItem = c.items[0];
            return lastItem && lastItem.updatedAt < thirtyDaysAgo;
        });
        if (churnThreats.length > 0) risks.push({ type: 'client', severity: 'high', title: `${churnThreats.length} Clientes VIP em Risco de Churn`, description: 'Clientes de alto valor sem interação há 30+ dias.', link: '/clientes' });

        // Opportunities
        if (pipelineValue > revenue * 2) opportunities.push({ type: 'commercial', title: 'Pipeline Robusto', description: `Pipeline de ${pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — ${(pipelineValue / (revenue || 1)).toFixed(1)}x a receita mensal.` });
        if (revenueTrend > 10) opportunities.push({ type: 'growth', title: 'Receita em Crescimento', description: `Crescimento de ${Math.round(revenueTrend)}% vs mês anterior.` });
        if (processScore >= 70) opportunities.push({ type: 'efficiency', title: 'Processos Maduros', description: `Maturidade de ${processScore}% permite escalar operações.` });
        if (activeGoals.length > 0 && avgGoalProgress >= 70) opportunities.push({ type: 'strategy', title: 'Metas no Caminho', description: `Progresso médio de ${avgGoalProgress}% nas metas ativas.` });

        // ── Strategic Pillars ──
        const pillars = [
            {
                name: 'Financeiro',
                score: Math.round(financialScore),
                trend: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'stable',
                recommendation: margin < 10 ? 'Revisar estrutura de custos urgentemente.' : margin < 20 ? 'Otimizar mix de receita para expandir margens.' : 'Manter disciplina financeira e explorar investimentos.'
            },
            {
                name: 'Pessoas',
                score: peopleScore,
                trend: turnover > 5 ? 'down' : 'up',
                recommendation: turnover > 10 ? 'Programas de retenção urgentes.' : turnover > 5 ? 'Monitorar clima e engajamento.' : 'Investir em desenvolvimento e cultura.'
            },
            {
                name: 'Processos',
                score: processScore,
                trend: processScore > 50 ? 'up' : 'down',
                recommendation: processScore < 30 ? 'Priorizar formalização de processos críticos.' : processScore < 60 ? 'Padronizar e documentar processos-chave.' : 'Automatizar fluxos maduros para ganhar escala.'
            },
            {
                name: 'Comercial',
                score: activeItems > 0 ? Math.min(100, Math.round((pipelineValue / (targetRevenue || revenue || 1)) * 50)) : 30,
                trend: pipelineValue > revenue ? 'up' : 'down',
                recommendation: activeItems === 0 ? 'Ativar pipeline de vendas imediatamente.' : pipelineValue < revenue * 2 ? 'Aumentar geração de leads — pipeline insuficiente.' : 'Pipeline saudável — focar em conversão.'
            },
            {
                name: 'Estratégia',
                score: Math.round(sgeScore),
                trend: sgeScore >= 70 ? 'up' : sgeScore >= 50 ? 'stable' : 'down',
                recommendation: sgeScore < 50 ? 'Empresa em risco — plano de ação urgente.' : sgeScore < 70 ? 'Alinhar equipe em torno de 2-3 prioridades.' : 'Estratégia sólida — refinar execução.'
            }
        ];

        // ── Org Heatmap ──
        const heatmap = {
            'Operações': { Gente: Math.min(100, peopleScore + 5), Processo: processScore, Resultado: activeItems > 0 ? 72 : 40 },
            'Financeiro': { Gente: 90, Processo: Math.min(100, processScore + 5), Resultado: Math.round(margin) },
            'RH': { Gente: Math.round(climateScore), Processo: 80, Resultado: turnover < 5 ? 85 : 60 },
            'Comercial': { Gente: 70, Processo: 65, Resultado: activeItems > 0 ? 85 : 50 },
            'Produção': { Gente: 80, Processo: Math.min(100, processScore + 10), Resultado: 70 }
        };

        // ── Decision Board ──
        const decisions: any[] = [];
        if (margin < 10) decisions.push({ priority: 'critical', action: 'Revisar estrutura de custos', impact: 'Alto', category: 'Financeiro', link: '/financeiro' });
        if (turnover > 5) decisions.push({ priority: 'high', action: 'Implementar programa de retenção', impact: 'Alto', category: 'Pessoas', link: '/pessoas' });
        if (processScore < 50) decisions.push({ priority: 'high', action: 'Formalizar processos críticos', impact: 'Médio', category: 'Processos', link: '/processos' });
        if (goalsAtRisk > 0) decisions.push({ priority: 'high', action: `Replanejar ${goalsAtRisk} meta(s) em risco`, impact: 'Alto', category: 'Estratégia', link: '/metas' });
        if (lateItems.length > 3) decisions.push({ priority: 'medium', action: 'Desbloquear itens com SLA vencido', impact: 'Médio', category: 'Operações', link: '/fluxos' });
        if (churnThreats.length > 0) decisions.push({ priority: 'high', action: `Reativar ${churnThreats.length} clientes VIP`, impact: 'Alto', category: 'Comercial', link: '/clientes' });
        if (runway < 6 && runway >= 3) decisions.push({ priority: 'medium', action: 'Planejar captação ou redução de custos', impact: 'Alto', category: 'Financeiro', link: '/financeiro' });

        // ── KPIs Summary ──
        const kpiSummary = kpis.map(k => ({
            name: k.name,
            value: k.value,
            target: k.target,
            unit: k.unit,
            status: k.status,
            progress: k.target > 0 ? Math.round((k.value / k.target) * 100) : 0
        }));

        const ceoMindData = {
            companyName: company?.name || 'Empresa',
            companySegment: company?.segment || '',
            timestamp: now.toISOString(),

            // Pulse
            pulse: {
                sgeScore,
                sgeStatus: sgeScore < 50 ? 'Empresa em Risco' : sgeScore < 75 ? 'Empresa em Transição' : 'Empresa Saudável',
                revenue,
                costs,
                margin: Math.round(margin),
                revenueTrend: Math.round(revenueTrend),
                headcount: activePeopleCount,
                activeItems,
                pipelineValue,
                runway,
                activeAlerts: activeAlerts.length,
                activeGoals: activeGoals.length,
                avgGoalProgress,
                totalClients: allClients,
                recentActivity: recentLogs,
            },

            // Strategic Diagnosis
            pillars,

            // Risks & Opportunities
            risks: risks.sort((a, b) => {
                const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                return (order[a.severity] || 3) - (order[b.severity] || 3);
            }).slice(0, 7),
            opportunities: opportunities.slice(0, 5),

            // Decision Board
            decisions: decisions.slice(0, 7),

            // Financial
            financial: {
                revenue,
                costs,
                profit: revenue - costs,
                margin: Math.round(margin),
                cashAvailable,
                runway,
                targetRevenue,
                targetMargin,
                burnRate: Math.round(recentBurnRate),
                history: monthlyHistory,
                revenueTrend: Math.round(revenueTrend),
            },

            // People
            people: {
                headcount: activePeopleCount,
                turnover,
                climateScore: Math.round(climateScore),
                departments: deptDistribution.slice(0, 8),
                totalPeople: allPeople.length,
            },

            // Goals
            goals: activeGoals.map(g => ({
                id: g.id,
                title: g.title,
                type: g.type,
                period: g.period,
                progress: g.progress,
                keyResults: (g.keyResults || []).map(kr => ({
                    title: kr.title,
                    current: kr.currentValue,
                    target: kr.targetValue,
                    unit: kr.unit,
                    progress: kr.targetValue > 0 ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0
                }))
            })),

            // KPIs
            kpis: kpiSummary,

            // Heatmap
            heatmap,

            // Alerts
            alerts: activeAlerts.map(a => ({
                id: a.id,
                title: a.title,
                description: a.description,
                type: a.type,
                priority: a.priority,
                createdAt: a.createdAt,
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
