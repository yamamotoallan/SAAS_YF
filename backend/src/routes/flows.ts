// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

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
router.post('/', async (req: AuthRequest, res) => {
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
        const flow = await prisma.operatingFlow.updateMany({
            where: { id: req.params.id, companyId: req.companyId },
            data: { name: req.body.name, type: req.body.type },
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
router.delete('/:id', async (req: AuthRequest, res) => {
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
router.post('/:id/stages', async (req: AuthRequest, res) => {
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

export default router;
