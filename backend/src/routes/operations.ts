// @ts-nocheck
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
            include: {
                stages: { orderBy: { order: 'asc' } },
                items: {
                    include: { stage: true, history: true },
                },
            },
        });

        const flowMetrics = flows.map(flow => {
            const activeItems = flow.items.filter(i => i.status === 'active');
            const completedItems = flow.items.filter(i => i.status === 'completed');
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

            // Delayed items
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
                reworkRate: 0, // Would need rework tracking
                valueProcessing: activeItems.reduce((s, i) => s + (i.value || 0), 0),
            };
        });

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
