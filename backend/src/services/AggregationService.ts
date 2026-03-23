import prisma from '../lib/prisma';

export class AggregationService {
    static async getCompanyMetrics(companyId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const safeQuery = async <T>(name: string, promise: Promise<T>, fallback: T): Promise<T> => {
            try { return await promise; }
            catch (err) {
                console.error(`[AggregationService] Query ${name} FAILED:`, err instanceof Error ? err.message : String(err));
                return fallback;
            }
        };

        const [
            monthFinancials,
            historyEntries,
            allTimeSums,
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
                where: { companyId, date: { gte: startOfMonth, lte: endOfMonth } }
            }), []),
            safeQuery('historyEntries', prisma.financialEntry.findMany({
                where: { companyId, date: { gte: sixMonthsAgo, lte: endOfMonth } },
                orderBy: { date: 'asc' }
            }), []),
            safeQuery('allTimeSums', prisma.financialEntry.groupBy({
                by: ['type'], where: { companyId }, _sum: { value: true }
            }), []),
            safeQuery('activePeopleCount', prisma.person.count({ where: { companyId, status: 'active' } }), 0),
            safeQuery('allPeople', prisma.person.findMany({
                where: { companyId },
                select: { id: true, name: true, role: true, department: true, status: true, salary: true, hireDate: true }
            }), []),
            safeQuery('kpis', prisma.kPI.findMany({ where: { companyId } }), []),
            safeQuery('activeItemsData', prisma.operatingItem.aggregate({
                where: { flow: { companyId }, status: 'active' }, _sum: { value: true }, _count: { id: true }
            }), { _sum: { value: null }, _count: { id: 0 } }),
            safeQuery('processBlocks', prisma.processBlock.findMany({
                where: { companyId }, include: { processes: true }
            }), []),
            safeQuery('activeAlerts', prisma.alert.findMany({
                where: { companyId, status: 'active' }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
            }), []),
            safeQuery('flows', prisma.operatingFlow.findMany({
                where: { companyId },
                include: { items: { where: { status: 'active' } }, stages: { orderBy: { order: 'asc' } } }
            }), []),
            safeQuery('goals', prisma.goal.findMany({
                where: { companyId }, include: { keyResults: true }, orderBy: { createdAt: 'desc' }
            }), []),
            safeQuery('lateItems', prisma.operatingItem.findMany({
                where: { flow: { companyId }, status: 'active', slaDueAt: { lt: now } },
                include: { flow: { select: { id: true, name: true, type: true } } }
            }), []),
            safeQuery('stagnantItems', prisma.operatingItem.findMany({
                where: { flow: { companyId }, status: 'active', updatedAt: { lt: sevenDaysAgo } }
            }), []),
            safeQuery('vips', prisma.client.findMany({
                where: { companyId, status: 'active' },
                include: { _count: { select: { items: true } }, items: { orderBy: { updatedAt: 'desc' }, take: 1 } },
                orderBy: { totalValue: 'desc' }, take: 20
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
        const revenue = monthFinancials.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
        const costs = monthFinancials.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
        const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

        const totalRev = allTimeSums.filter(s => s.type === 'revenue' || s.type === 'INCOME').reduce((acc, s) => acc + Number(s._sum.value || 0), 0);
        const totalCost = allTimeSums.filter(s => s.type === 'cost' || s.type === 'EXPENSE').reduce((acc, s) => acc + Number(s._sum.value || 0), 0);
        const cashAvailable = totalRev - totalCost;

        const recentExpenses = historyEntries.filter(e => e.date >= threeMonthsAgo && (e.type === 'cost' || e.type === 'EXPENSE'));
        const recentBurnRate = recentExpenses.reduce((s, e) => s + Number(e.value || 0), 0) / 3;
        const runway = recentBurnRate > 0 ? Math.floor(cashAvailable / recentBurnRate) : 0;

        const monthlyHistory: { month: string; revenue: number; costs: number; profit: number }[] = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const monthEntries = historyEntries.filter(e => e.date.getMonth() === d.getMonth() && e.date.getFullYear() === d.getFullYear());
            const mRev = monthEntries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
            const mCost = monthEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
            const monthName = d.toLocaleString('pt-BR', { month: 'short' });
            monthlyHistory.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), revenue: mRev, costs: mCost, profit: mRev - mCost });
        }
        
        const prevMonthData = monthlyHistory.length >= 2 ? monthlyHistory[monthlyHistory.length - 2] : null;
        const revenueTrend = prevMonthData && prevMonthData.revenue > 0 ? ((revenue - prevMonthData.revenue) / prevMonthData.revenue) * 100 : 0;

        // ── People Calculations ──
        const turnoverKpi = kpis.find(k => k.name.toLowerCase().includes('turnover')) || kpis.find(k => k.category === 'Pessoas' && k.name.toLowerCase().includes('rotatividade'));
        const climateKpi = kpis.find(k => k.name.toLowerCase().includes('clima')) || kpis.find(k => k.name.toLowerCase().includes('satisfação')) || kpis.find(k => k.name.toLowerCase().includes('enps'));
        
        const turnover = turnoverKpi ? turnoverKpi.value : 0;
        let climateScore = 4.0;
        let climatePercent = 75;
        if (climateKpi) {
            climateScore = (climateKpi.unit === 'percentage' || climateKpi.unit === '%' || climateKpi.value > 10) ? (climateKpi.value / 100) * 5 : climateKpi.value;
            climatePercent = (climateKpi.unit === 'percentage' || climateKpi.unit === '%' || climateKpi.value > 10) ? climateKpi.value : (climateKpi.value / 5) * 100;
        }

        const turnoverScore = Math.max(0, 100 - (turnover * 2));
        const climatePoints = (climateScore / 5) * 100;
        const peopleScore = Math.round((climatePoints * 0.4) + (turnoverScore * 0.4) + 20);

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

        // ── Pipeline & Score ──
        const pipelineValue = Number(activeItemsData._sum.value || 0);
        const activeItems = activeItemsData._count.id;
        const financialScore = Math.max(0, Math.min(100, margin * 2 + (revenue > 0 ? 30 : 0)));
        const sgeScore = Math.round((financialScore * 0.35 + peopleScore * 0.25 + processScore * 0.25 + (activeItems > 0 ? 80 : 0) * 0.15));

        return {
            raw: { historyEntries, allPeople, processBlocks, activeAlerts, flows, goals, lateItems, stagnantItems, vips, company, allClients, recentLogs, kpis, thirtyDaysAgo },
            metrics: {
                revenue, costs, margin, cashAvailable, recentBurnRate, runway, revenueTrend,
                historicalFinancials: monthlyHistory,
                headcount: activePeopleCount,
                turnover, climateScore, climatePercent, peopleScore,
                processScore,
                pipelineValue, activeItems,
                sgeScore,
                financialScore
            }
        };
    }
}
