import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { cache } from '../lib/cache';

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

        // Check cache first
        const forceRefresh = req.query.refresh === 'true';
        const cachedContent = cache.get(cacheKey);
        if (cachedContent && !forceRefresh) {
            console.log(`[Dashboard] Serving from cache for company: ${companyId}`);
            return res.json(cachedContent);
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Function wrapper for logging
        const logQuery = async <T>(name: string, promise: Promise<T>): Promise<T> => {
            console.log(`[Dashboard] Starting query: ${name}`);
            try {
                const res = await promise;
                console.log(`[Dashboard] Query ${name} completed`);
                return res;
            } catch (err) {
                console.error(`[Dashboard] Query ${name} FAILED:`, err);
                throw new Error(`Failure in query ${name}: ${err instanceof Error ? err.message : String(err)}`);
            }
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            monthFinancials,
            financialTotals,
            activePeopleCount,
            kpis,
            activeItemsData,
            processBlocks,
            activeAlerts,
            flows,
            historyEntries,
            lateItems,
            allTimeSums,
            stagnantItems,
            revenueGoal,
            vips
        ] = await Promise.all([
            logQuery('monthFinancials', prisma.financialEntry.findMany({
                where: { companyId, date: { gte: startOfMonth, lte: endOfMonth } },
            })),
            logQuery('financialTotals', prisma.financialEntry.aggregate({
                where: { companyId },
                _sum: { value: true },
                _count: { id: true },
            })),
            logQuery('activePeopleCount', prisma.person.count({ where: { companyId, status: 'active' } })),
            logQuery('kpis', prisma.kPI.findMany({ where: { companyId } })),
            logQuery('activeItemsData', prisma.operatingItem.aggregate({
                where: { flow: { companyId }, status: 'active' },
                _sum: { value: true },
                _count: { id: true },
            })),
            logQuery('processBlocks', prisma.processBlock.findMany({
                where: { companyId },
                include: { processes: true },
            })),
            logQuery('activeAlerts', prisma.alert.findMany({
                where: { companyId, status: 'active' },
                orderBy: { priority: 'desc' },
                take: 3
            })),
            logQuery('flows', prisma.operatingFlow.findMany({
                where: { companyId },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true,
                    companyId: true,
                    items: { where: { status: 'active' } },
                    stages: { orderBy: { order: 'asc' } }
                }
            })),
            logQuery('historyEntries', prisma.financialEntry.findMany({
                where: {
                    companyId,
                    date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1), lte: endOfMonth }
                },
                orderBy: { date: 'asc' }
            })),
            logQuery('lateItems', prisma.operatingItem.findMany({
                where: { flow: { companyId }, status: 'active', slaDueAt: { lt: now } },
                include: { flow: true }
            })),
            logQuery('allTimeSums', prisma.financialEntry.groupBy({
                by: ['type'],
                where: { companyId },
                _sum: { value: true }
            })),
            logQuery('stagnantItems', prisma.operatingItem.findMany({
                where: { flow: { companyId }, status: 'active', updatedAt: { lt: sevenDaysAgo } }
            })),
            logQuery('revenueGoal', prisma.goal.findFirst({
                where: { companyId, title: { contains: 'Receita', mode: 'insensitive' } },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    period: true,
                    status: true,
                    progress: true,
                    createdAt: true,
                    updatedAt: true,
                    companyId: true,
                    keyResults: true
                }
            })),
            logQuery('vips', prisma.client.findMany({
                where: { companyId, status: 'active', items: { some: { status: 'won' } } },
                include: {
                    _count: { select: { items: { where: { status: 'won' } } } },
                    items: { orderBy: { updatedAt: 'desc' }, take: 1 }
                }
            }))
        ]);

        console.log(`[Dashboard] All ${14} queries completed for company: ${companyId}`);

        // Process Financial Summary
        const revenue = monthFinancials
            .filter(e => e.type === 'revenue' || e.type === 'INCOME')
            .reduce((s, e) => s + Number(e.value || 0), 0);
        const costs = monthFinancials
            .filter(e => e.type === 'cost' || e.type === 'EXPENSE')
            .reduce((s, e) => s + Number(e.value || 0), 0);
        const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

        const totalRev = allTimeSums
            .filter(s => s.type === 'revenue' || s.type === 'INCOME')
            .reduce((acc, s) => acc + Number(s._sum.value || 0), 0);
        const totalCost = allTimeSums
            .filter(s => s.type === 'cost' || s.type === 'EXPENSE')
            .reduce((acc, s) => acc + Number(s._sum.value || 0), 0);

        const cashAvailable = totalRev - totalCost;

        // Refined Intelligence: Use last 3 months for burn rate calculation
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const recentExpenses = historyEntries.filter(e => e.date >= threeMonthsAgo && (e.type === 'cost' || e.type === 'EXPENSE'));
        const recentBurnRate = recentExpenses.reduce((s, e) => s + Number(e.value || 0), 0) / 3;

        const operatingMonths = recentBurnRate > 0 ? Math.floor(cashAvailable / recentBurnRate) : 0;

        // People Data
        const turnoverKpi = kpis.find(k => k.name.toLowerCase().includes('turnover'))
            || kpis.find(k => k.category === 'Pessoas' && k.name.toLowerCase().includes('rotatividade'));

        const climateKpi = kpis.find(k => k.name.toLowerCase().includes('clima'))
            || kpis.find(k => k.name.toLowerCase().includes('satisfação'))
            || kpis.find(k => k.name.toLowerCase().includes('enps'));

        let climateScore = 4.0;
        if (climateKpi) {
            climateScore = (climateKpi.unit === 'percentage' || climateKpi.value > 10)
                ? (climateKpi.value / 100) * 5
                : climateKpi.value;
        }

        const peopleData = {
            headcount: activePeopleCount,
            turnover: turnoverKpi ? turnoverKpi.value : 0,
            climateScore: Number(climateScore.toFixed(1)),
            burnRate: Math.round(recentBurnRate)
        };

        // Refined People Score formula: Climate (40%), Turnover (40%), Headcount Growth (20%)
        // Assume turnover > 15% is bad, climate < 4.0 is bad
        const turnoverScore = Math.max(0, 100 - (peopleData.turnover * 2)); // 20% turnover = 60 points
        const climatePoints = (peopleData.climateScore / 5) * 100;
        const peopleScore = (climatePoints * 0.4) + (turnoverScore * 0.4) + 20; // Simplified

        // Pipeline
        const pipelineValue = Number(activeItemsData._sum.value || 0);
        const activeItems = activeItemsData._count.id;

        // Process Maturity
        let overallProcessScore = 0;
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
            overallProcessScore = Math.round(blockScores.reduce((s, v) => s + v, 0) / blockScores.length);
        }

        // Bottleneck Analysis
        const flowToProcessMap: Record<string, string> = {
            'sales': 'ops', 'service': 'ops', 'project': 'ops', 'financial': 'finance', 'human_resources': 'people'
        };
        const bottlenecks = processBlocks.map(block => {
            const friction = lateItems.filter(item => flowToProcessMap[item.flow.type] === block.type).length;
            return { name: block.name, friction, score: 0 }; // simplified for now
        }).filter(b => b.friction > 0).sort((a, b) => b.friction - a.friction).slice(0, 3);

        // SGE Score
        const financialScore = Math.max(0, Math.min(100, margin * 2 + (revenue > 0 ? 30 : 0)));
        const sgeScore = Math.round((financialScore * 0.35 + peopleScore * 0.25 + overallProcessScore * 0.25 + (activeItems > 0 ? 80 : 0) * 0.15));

        const priorityActions = [];
        if (operatingMonths < 3) priorityActions.push({ type: 'financial', priority: 'critical', text: 'Baixo Caixa (Runway < 3 meses)', meta: 'Financeiro • Urgente', link: '/financeiro' });
        if (margin < 10) priorityActions.push({ type: 'financial', priority: 'high', text: 'Margem Operacional Crítica (<10%)', meta: 'Financeiro • Revisar Custos', link: '/financeiro' });

        // New Intelligence: Burn Rate Acceleration alert
        const prevSixMonths = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const olderExpenses = historyEntries.filter(e => e.date >= prevSixMonths && e.date < threeMonthsAgo && (e.type === 'cost' || e.type === 'EXPENSE'));
        const historicalBurnRate = olderExpenses.reduce((s, e) => s + Number(e.value || 0), 0) / 3;

        if (historicalBurnRate > 0 && recentBurnRate > historicalBurnRate * 1.25) {
            priorityActions.push({ type: 'financial', priority: 'high', text: 'Aceleração de Gastos Detectada', meta: `Crescimento de ${Math.round((recentBurnRate / historicalBurnRate - 1) * 100)}% nos custos`, link: '/financeiro' });
        }

        const hasHighValue = flows.some(f => f.items.some(i => Number(i.value || 0) > 50000));
        if (hasHighValue) priorityActions.push({ type: 'operational', priority: 'medium', text: 'Oportunidades de alto valor detectadas', meta: 'Fluxos • Acompanhar', link: '/fluxos' });

        if (peopleData.turnover > 5) priorityActions.push({ type: 'people', priority: 'high', text: 'Turnover acima do ideal (>5%)', meta: 'Pessoas • Retenção', link: '/pessoas' });
        if (overallProcessScore < 50) priorityActions.push({ type: 'process', priority: 'medium', text: 'Baixa Maturidade de Processos', meta: 'Processos • Padronizar', link: '/processos' });

        activeAlerts.forEach(alert => {
            priorityActions.push({ type: 'alert', priority: alert.priority === 'critical' ? 'critical' : 'high', text: alert.title, meta: 'Alerta • Manual', link: '/alertas' });
        });

        if (stagnantItems.length > 0) {
            priorityActions.push({
                type: 'commercial',
                priority: 'high',
                text: `${stagnantItems.length} oportunidades estagnadas há +7 dias`,
                meta: 'Comercial • Reativar Leads',
                link: '/fluxos'
            });
        }

        const goalTarget = revenueGoal?.keyResults[0]?.targetValue || 0;

        if (revenueGoal && goalTarget > 0 && pipelineValue < goalTarget * 2) {
            priorityActions.push({
                type: 'commercial',
                priority: 'critical',
                text: 'Pipeline insuficiente para bater meta (Saúde < 50%)',
                meta: 'Comercial • Urgente',
                link: '/fluxos'
            });
        }
        const churnThreats = vips.filter(c => {
            const lastItem = c.items[0];
            return lastItem && lastItem.updatedAt < thirtyDaysAgo;
        });

        if (churnThreats.length > 0) {
            priorityActions.push({
                type: 'client',
                priority: 'high',
                text: `${churnThreats.length} clientes VIP com risco de Churn`,
                meta: 'CS • Inatividade > 30 dias',
                link: '/clientes'
            });
        }

        // Intelligence: Operational Bottlenecks
        const criticalBottlenecks = flows.filter(f => {
            const totalItems = f.items.length;
            const avgCapacity = Math.max(10, Math.ceil(totalItems / f.stages.length) * 1.5);
            return f.stages.some(s => f.items.filter(i => i.stageId === s.id && i.status === 'active').length > avgCapacity);
        });

        if (criticalBottlenecks.length > 0) {
            priorityActions.push({
                type: 'operational',
                priority: 'high',
                text: `Gargalo em ${criticalBottlenecks.length} fluxos operacionais`,
                meta: 'Operação • Reveja capacidades',
                link: '/operacao'
            });
        }

        // Intelligence: Resource Overload
        const allActiveItems = flows.flatMap(f => f.items).filter(i => i.status === 'active');
        const userLoad: Record<string, number> = {};
        allActiveItems.forEach(i => {
            if (i.responsibleId) {
                userLoad[i.responsibleId] = (userLoad[i.responsibleId] || 0) + 1;
            }
        });

        const overloadedUsers = Object.values(userLoad).filter(count => count > 15).length;
        if (overloadedUsers > 0) {
            priorityActions.push({
                type: 'people',
                priority: 'medium',
                text: `${overloadedUsers} colaboradores com sobrecarga de itens`,
                meta: 'Pessoas • Redistribuir carga',
                link: '/operacao'
            });
        }

        // History
        const financialHistory = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const monthName = d.toLocaleString('pt-BR', { month: 'short' });
            const monthEntries = historyEntries.filter(e => e.date.getMonth() === d.getMonth() && e.date.getFullYear() === d.getFullYear());
            const monthRev = monthEntries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
            const monthCost = monthEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
            financialHistory.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), revenue: monthRev, costs: monthCost, profit: monthRev - monthCost });
        }

        const dashboardData = {
            sgeScore,
            sgeStatus: sgeScore < 50 ? 'Empresa em Risco' : sgeScore < 75 ? 'Empresa em Transição' : 'Empresa Saudável',
            financial: { revenue, costs, margin: Math.round(margin), cashAvailable, operatingMonths, history: financialHistory },
            people: peopleData,
            pipeline: { value: pipelineValue, activeItems },
            processMaturity: { score: overallProcessScore, status: overallProcessScore >= 70 ? 'Saudável' : overallProcessScore >= 40 ? 'Transição' : 'Risco' },
            actions: priorityActions.slice(0, 5),
            alerts: activeAlerts,
            flows: flows.map(f => ({ id: f.id, name: f.name, activeItems: f.items.length, totalValue: f.items.reduce((s, i) => s + Number(i.value || 0), 0) })),
            heatmap: {
                'Ops': { Gente: 85, Processo: overallProcessScore, Resultado: 72 },
                'Fin': { Gente: 90, Processo: overallProcessScore + 5, Resultado: Math.round(margin) },
                'RH': { Gente: Math.round(peopleScore), Processo: 80, Resultado: 75 },
                'Com': { Gente: 70, Processo: 65, Resultado: activeItems > 0 ? 85 : 50 },
                'Prod': { Gente: 80, Processo: 85, Resultado: 70 }
            },
            spider: {
                'Financeiro': Math.round(margin),
                'Pessoas': Math.round(peopleScore),
                'Processos': overallProcessScore,
                'Estratégia': sgeScore,
                'Comercial': activeItems > 0 ? 80 : 40
            },
            bottlenecks
        };

        // Store in cache
        cache.set(cacheKey, dashboardData);

        res.json(dashboardData);
    } catch (err) {
        console.error('[Dashboard Error]:', err);
        const errorMessage = err instanceof Error ? err.stack || err.message : String(err);
        res.status(500).json({
            error: `Erro: ${errorMessage.substring(0, 150)}`,
            details: errorMessage
        });
    }
});

export default router;
