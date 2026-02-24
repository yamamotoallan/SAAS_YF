import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';

const router = Router();

// GET /api/flows
router.get('/', async (req: AuthRequest, res) => {
    try {
        const flows = await prisma.operatingFlow.findMany({
            where: { companyId: req.companyId },
            include: {
                stages: { orderBy: { order: 'asc' } },
                _count: { select: { items: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json(flows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar fluxos' });
    }
});

// GET /api/flows/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const flow = await prisma.operatingFlow.findFirst({
            where: { id: req.params.id, companyId: req.companyId },
            include: {
                stages: { orderBy: { order: 'asc' } },
                items: {
                    include: { client: true, responsible: true, stage: true },
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });

        if (!flow) { res.status(404).json({ error: 'Fluxo não encontrado' }); return; }
        res.json(flow);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar fluxo' });
    }
});

// POST /api/flows
router.post('/', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const { name, type, stages } = req.body;

        if (!name || !type) { res.status(400).json({ error: 'Nome e tipo são obrigatórios' }); return; }

        const flow = await prisma.operatingFlow.create({
            data: {
                name,
                type,
                companyId: req.companyId!,
                stages: stages ? {
                    create: stages.map((s: any, i: number) => ({
                        name: s.name,
                        order: i,
                        sla: s.sla || 24,
                        type: s.type || 'process',
                    })),
                } : undefined,
            },
            include: { stages: { orderBy: { order: 'asc' } } },
        });

        res.status(201).json(flow);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar fluxo' });
    }
});

// PUT /api/flows/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const { name, type } = req.body;
        const flow = await prisma.operatingFlow.updateMany({
            where: { id: req.params.id, companyId: req.companyId },
            data: { name, type },
        });

        if (flow.count === 0) { res.status(404).json({ error: 'Fluxo não encontrado' }); return; }

        const updated = await prisma.operatingFlow.findUnique({
            where: { id: req.params.id },
            include: { stages: { orderBy: { order: 'asc' } } },
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar fluxo' });
    }
});

// DELETE /api/flows/:id
router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        await prisma.operatingFlow.deleteMany({
            where: { id: req.params.id, companyId: req.companyId },
        });
        res.json({ message: 'Fluxo removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover fluxo' });
    }
});

// POST /api/flows/:id/stages
router.post('/:id/stages', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const { name, sla, type } = req.body;
        const flow = await prisma.operatingFlow.findFirst({
            where: { id: req.params.id, companyId: req.companyId },
            include: { stages: true },
        });

        if (!flow) { res.status(404).json({ error: 'Fluxo não encontrado' }); return; }

        const stage = await prisma.flowStage.create({
            data: {
                name,
                order: flow.stages.length,
                sla: sla || 24,
                type: type || 'process',
                flowId: flow.id,
            },
        });

        res.status(201).json(stage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar etapa' });
    }
});

// GET /api/flows/:id/analytics
router.get('/:id/analytics', async (req: AuthRequest, res) => {
    try {
        const flowId = req.params.id;
        const companyId = req.companyId as string;

        // Fetch flow with stages and items
        const flow = await prisma.operatingFlow.findFirst({
            where: { id: flowId, companyId },
            include: {
                stages: { orderBy: { order: 'asc' } },
                items: {
                    include: { history: true }
                }
            }
        });

        if (!flow) {
            res.status(404).json({ error: 'Fluxo não encontrado' });
            return;
        }

        const items = flow.items;
        const totalItems = items.length;
        const wonItems = items.filter(i => i.status === 'won');
        const lostItems = items.filter(i => i.status === 'lost');
        const activeItems = items.filter(i => i.status === 'active');

        const winRate = totalItems > 0 ? (wonItems.length / (wonItems.length + lostItems.length || 1)) * 100 : 0;

        // 1. Funnel Conversion
        const funnel = flow.stages.map(stage => {
            const count = items.filter(i => i.stageId === stage.id || i.history.some(h => h.toStage === stage.id)).length;
            return {
                stageId: stage.id,
                name: stage.name,
                count
            };
        });

        // 2. Average Cycle Time (per stage)
        const cycleTimes = flow.stages.map(stage => {
            const stageHistories = items.flatMap(i => i.history)
                .filter(h => h.fromStage === stage.id && h.createdAt);

            let totalMs = 0;
            let moves = 0;

            items.forEach(item => {
                const entry = item.history.find(h => h.toStage === stage.id);
                const exit = item.history.find(h => h.fromStage === stage.id);

                if (entry && exit) {
                    totalMs += exit.createdAt.getTime() - entry.createdAt.getTime();
                    moves++;
                }
            });

            return {
                stageId: stage.id,
                name: stage.name,
                avgHours: moves > 0 ? Math.round(totalMs / (1000 * 60 * 60 * moves)) : 0
            };
        });

        // 3. Sales Velocity (Time from creation to 'won')
        let totalVelocityMs = 0;
        wonItems.forEach(item => {
            if (item.closedAt) {
                totalVelocityMs += item.closedAt.getTime() - item.createdAt.getTime();
            }
        });
        const avgVelocityDays = wonItems.length > 0
            ? Math.round(totalVelocityMs / (1000 * 60 * 60 * 24 * wonItems.length))
            : 0;

        // 4. Revenue Forecast (Weighted by Win Rate)
        const pipelineValue = activeItems.reduce((s, i) => s + Number(i.value || 0), 0);
        const forecastValue = Math.round(pipelineValue * (winRate / 100));

        res.json({
            winRate: Math.round(winRate),
            funnel,
            cycleTimes,
            avgVelocityDays,
            forecast: {
                pipelineValue,
                forecastValue
            },
            counts: {
                total: totalItems,
                won: wonItems.length,
                lost: lostItems.length,
                active: activeItems.length
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar análise do fluxo' });
    }
});

export default router;
