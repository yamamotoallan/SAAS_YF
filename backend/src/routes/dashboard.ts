// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard
router.get('/', async (req: AuthRequest, res) => {
    try {
        const companyId = req.companyId!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 1. Financial Summary
        const financialEntries = await prisma.financialEntry.findMany({
            where: { companyId, date: { gte: startOfMonth, lte: endOfMonth } },
        });
        const revenue = financialEntries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || e.amount || 0), 0);
        const costs = financialEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || e.amount || 0), 0);
        const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

        // All-time cash (Runway)
        const allFinancial = await prisma.financialEntry.findMany({ where: { companyId } });
        const totalRev = allFinancial.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || e.amount || 0), 0);
        const totalCost = allFinancial.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || e.amount || 0), 0);
        const cashAvailable = totalRev - totalCost;
        const averageMonthlyCost = totalCost / (await prisma.financialEntry.findMany({ where: { companyId, type: { in: ['cost', 'EXPENSE'] } } }).then(r => Math.max(1, new Set(r.map(e => e.date.getMonth())).size)) || 1);
        const operatingMonths = averageMonthlyCost > 0 ? Math.floor(cashAvailable / averageMonthlyCost) : 0;

        // 2. People Summary (KPIs)
        const people = await prisma.person.findMany({ where: { companyId, status: 'active' } });
        const headcount = people.length;

        const kpis = await prisma.kPI.findMany({ where: { companyId } });

        // Find specific KPIs with smarter matching
        const turnoverKpi = kpis.find(k => k.name.toLowerCase().includes('turnover'))
            || kpis.find(k => k.category === 'Pessoas' && k.name.toLowerCase().includes('rotatividade'));

        const climateKpi = kpis.find(k => k.name.toLowerCase().includes('clima'))
            || kpis.find(k => k.name.toLowerCase().includes('satisfação'))
            || kpis.find(k => k.name.toLowerCase().includes('enps'));

        let climateScore = 4.0; // Default
        if (climateKpi) {
            // Normalize to 0-5 scale
            if (climateKpi.unit === 'percentage' || climateKpi.value > 10) {
                climateScore = (climateKpi.value / 100) * 5;
            } else {
                climateScore = climateKpi.value;
            }
        }

        const peopleData = {
            headcount,
            turnover: turnoverKpi ? turnoverKpi.value : 0,
            climateScore: Number(climateScore.toFixed(1)),
        };

        // 3. Pipeline value
        const items = await prisma.operatingItem.findMany({
            where: { flow: { companyId }, status: 'active' },
        });
        const pipelineValue = items.reduce((s, i) => s + Number(i.value || 0), 0);
        const activeItems = items.length;

        // 4. Process maturity
        const processBlocks = await prisma.processBlock.findMany({
            where: { companyId },
            include: { processes: true },
        });

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

        // 5. Calculate SGE Score (Weighted)
        const financialScore = Math.max(0, Math.min(100, margin * 2 + (revenue > 0 ? 30 : 0)));
        const peopleScore = (peopleData.climateScore / 5) * 100;
        const sgeScore = Math.round((financialScore * 0.35 + peopleScore * 0.25 + overallProcessScore * 0.25 + (activeItems > 0 ? 80 : 0) * 0.15));

        let sgeStatus = 'Empresa Saudável';
        if (sgeScore < 50) sgeStatus = 'Empresa em Risco';
        else if (sgeScore < 75) sgeStatus = 'Empresa em Transição';

        // 6. Generate Priority Actions (Dynamic)
        const priorityActions = [];

        // Financial Triggers
        if (operatingMonths < 3) {
            priorityActions.push({
                type: 'financial',
                priority: 'critical',
                text: 'Baixo Caixa (Runway < 3 meses)',
                meta: 'Financeiro • Urgente',
                link: '/financeiro'
            });
        }
        if (margin < 10) {
            priorityActions.push({
                type: 'financial',
                priority: 'high',
                text: 'Margem Operacional Crítica (<10%)',
                meta: 'Financeiro • Revisar Custos',
                link: '/financeiro'
            });
        }

        // Operational Triggers
        const highValueItems = items.filter(i => (i.value || 0) > 50000);
        if (highValueItems.length > 0) {
            priorityActions.push({
                type: 'operational',
                priority: 'medium',
                text: `${highValueItems.length} oportunidades de alto valor`,
                meta: 'Fluxos • Acompanhar',
                link: '/fluxos'
            });
        }

        // People Triggers
        if (peopleData.turnover > 5) {
            priorityActions.push({
                type: 'people',
                priority: 'high',
                text: 'Turnover acima do ideal (>5%)',
                meta: 'Pessoas • Retenção',
                link: '/pessoas'
            });
        }

        // Process Triggers
        if (overallProcessScore < 50) {
            priorityActions.push({
                type: 'process',
                priority: 'medium',
                text: 'Baixa Maturidade de Processos',
                meta: 'Processos • Padronizar',
                link: '/processos'
            });
        }

        // Add Manual Alerts
        const activeAlerts = await prisma.alert.findMany({
            where: { companyId, status: 'active' },
            orderBy: { priority: 'desc' }, // 'critical' > 'high' > 'medium'
            take: 3
        });

        activeAlerts.forEach(alert => {
            priorityActions.push({
                type: 'alert',
                priority: alert.priority === 'critical' ? 'critical' : 'high',
                text: alert.title,
                meta: 'Alerta • Manual',
                link: '/alertas'
            });
        });

        // Flows for chart
        const flows = await prisma.operatingFlow.findMany({
            where: { companyId },
            include: { items: { where: { status: 'active' } } },
        });

        // 7. Financial History (Last 6 Months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const historyEntries = await prisma.financialEntry.findMany({
            where: {
                companyId,
                date: { gte: sixMonthsAgo, lte: endOfMonth }
            },
            orderBy: { date: 'asc' }
        });

        const financialHistory = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const monthName = d.toLocaleString('pt-BR', { month: 'short' });
            const monthEntries = historyEntries.filter(e =>
                e.date.getMonth() === d.getMonth() && e.date.getFullYear() === d.getFullYear()
            );

            const monthRev = monthEntries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
            const monthCost = monthEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);

            financialHistory.push({
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                revenue: monthRev,
                costs: monthCost,
                profit: monthRev - monthCost
            });
        }

        res.json({
            sgeScore,
            sgeStatus,
            financial: {
                revenue,
                costs,
                margin: Math.round(margin),
                cashAvailable,
                operatingMonths,
                history: financialHistory
            },
            people: peopleData,
            pipeline: {
                value: pipelineValue,
                activeItems,
            },
            processMaturity: {
                score: overallProcessScore,
                status: overallProcessScore >= 70 ? 'Saudável' : overallProcessScore >= 40 ? 'Transição' : 'Risco',
            },
            actions: priorityActions.slice(0, 5), // Limit to top 5
            alerts: activeAlerts, // Backwards compatibility for sidebar
            flows: flows.map(f => ({
                id: f.id,
                name: f.name,
                activeItems: f.items.length,
                totalValue: f.items.reduce((s, i) => s + Number(i.value || 0), 0),
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar dashboard' });
    }
});

export default router;
