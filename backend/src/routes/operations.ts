import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/operations/metrics
router.get('/metrics', async (req: AuthRequest, res) => {
    try {
        const companyId = req.companyId!;

        const flows = await prisma.operatingFlow.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
                updatedAt: true,
                companyId: true,
                stages: { orderBy: { order: 'asc' } },
                items: {
                    include: { stage: true, responsible: true },
                },
            },
        });

        const flowMetrics = flows.map(flow => {
            const activeItems = flow.items.filter(i => i.status === 'active');
            const completedItems = flow.items.filter(i => i.status === 'completed' || i.status === 'won');
            const totalItems = flow.items.length;

            // Stage analysis
            const stageMetrics = flow.stages.map(stage => {
                const stageItems = activeItems.filter(i => i.stageId === stage.id);
                const capacity = Math.max(10, Math.ceil(totalItems / flow.stages.length) * 1.5);
                const volume = stageItems.length;

                // Avg time in stage (days)
                const avgTime = stageItems.length > 0
                    ? stageItems.reduce((sum, item) => {
                        const diff = Date.now() - new Date(item.updatedAt).getTime();
                        return sum + diff / (1000 * 60 * 60 * 24);
                    }, 0) / stageItems.length
                    : 0;

                return {
                    id: stage.id,
                    name: stage.name,
                    volume,
                    capacity,
                    sla: stage.sla,
                    avgTime: Math.round(avgTime * 10) / 10,
                    value: stageItems.reduce((s, i) => s + (i.value || 0), 0),
                    isBottleneck: volume > capacity * 0.8,
                };
            });

            // SLA Risk Prediction for active items
            const itemRisks = activeItems.map(item => {
                const stage = flow.stages.find(s => s.id === item.stageId);
                const timeInStage = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

                let riskLevel = 'low';
                if (stage && stage.sla && timeInStage > stage.sla) riskLevel = 'critical';
                else if (stage && stage.sla && timeInStage > stage.sla * 0.7) riskLevel = 'medium';

                return {
                    id: item.id,
                    title: item.title,
                    timeInStage: Math.round(timeInStage * 10) / 10,
                    riskLevel,
                    responsible: (item as any).responsible?.name || 'Sem responsável'
                };
            }).filter(i => i.riskLevel !== 'low');

            // Overall metrics
            const now = Date.now();
            const avgCycleTime = completedItems.length > 0
                ? completedItems.reduce((sum, item) => {
                    const created = new Date(item.createdAt).getTime();
                    const updated = new Date(item.updatedAt).getTime();
                    return sum + (updated - created) / (1000 * 60 * 60 * 24);
                }, 0) / completedItems.length
                : 0;

            // SLA compliance
            const itemsWithSla = activeItems.filter(i => i.slaDueAt);
            const onTime = itemsWithSla.filter(i => new Date(i.slaDueAt!) > new Date(now));
            const slaCompliance = itemsWithSla.length > 0
                ? Math.round((onTime.length / itemsWithSla.length) * 100)
                : 100;

            const delayedItems = activeItems.filter(i =>
                i.slaDueAt && new Date(i.slaDueAt) < new Date(now)
            ).length;

            const bottlenecks = stageMetrics.filter(s => s.isBottleneck).map(s => s.id);

            return {
                flowId: flow.id,
                flowName: flow.name,
                flowType: flow.type,
                totalActive: activeItems.length,
                completedPeriod: completedItems.length,
                avgCycleTime: Math.round(avgCycleTime * 10) / 10,
                slaCompliance,
                stages: stageMetrics,
                bottlenecks,
                delayedItems,
                itemRisks,
                valueProcessing: activeItems.reduce((s, i) => s + (i.value || 0), 0),
            };
        });

        // Productivity Ranking (Across all flows)
        const allItems = flows.flatMap(f => f.items);
        const completedAcrossAll = allItems.filter(i => i.status === 'completed' || i.status === 'won');

        const userStats: Record<string, { name: string, completed: number, active: number }> = {};

        allItems.forEach(item => {
            const userId = item.responsibleId || 'unassigned';
            const userName = (item as any).responsible?.name || 'Sem responsável';

            if (!userStats[userId]) userStats[userId] = { name: userName, completed: 0, active: 0 };

            if (item.status === 'active') userStats[userId].active++;
            if (item.status === 'completed' || item.status === 'won') userStats[userId].completed++;
        });

        const productivityRanking = Object.values(userStats)
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 5);

        // Overall diagnosis
        const totalActive = flowMetrics.reduce((s, f) => s + f.totalActive, 0);
        const avgSla = flowMetrics.length > 0
            ? Math.round(flowMetrics.reduce((s, f) => s + f.slaCompliance, 0) / flowMetrics.length)
            : 100;
        const totalBottlenecks = flowMetrics.reduce((s, f) => s + f.bottlenecks.length, 0);

        let status = 'Operação Equilibrada';
        let statusClass = 'success';
        if (avgSla < 70 || totalBottlenecks > 1) {
            status = 'Operação sob Pressão';
            statusClass = 'warning';
        }
        if (avgSla < 50 || totalBottlenecks > 2) {
            status = 'Operação em Risco';
            statusClass = 'danger';
        }

        res.json({
            flows: flowMetrics,
            productivityRanking,
            overall: {
                totalActive,
                avgSlaCompliance: avgSla,
                totalBottlenecks,
                status,
                statusClass,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar métricas operacionais' });
    }
});

export default router;
