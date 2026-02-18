// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/items
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { flowId, stageId, status, search, priority } = req.query;

        const where: any = {};

        // Ensure company scope via flow
        if (flowId) {
            where.flowId = flowId;
        }
        if (stageId) {
            where.stageId = stageId;
        }
        if (status && status !== 'all') {
            where.status = status;
        }
        if (priority && priority !== 'all') {
            where.priority = priority;
        }
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const items = await prisma.operatingItem.findMany({
            where,
            include: {
                client: true,
                responsible: true,
                stage: true,
                flow: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar itens' });
    }
});

// GET /api/items/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const item = await prisma.operatingItem.findUnique({
            where: { id: req.params.id },
            include: {
                client: true,
                responsible: true,
                stage: true,
                flow: { include: { stages: { orderBy: { order: 'asc' } } } },
                history: { orderBy: { createdAt: 'desc' } },
            },
        });

        if (!item) { res.status(404).json({ error: 'Item não encontrado' }); return; }
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar item' });
    }
});

// POST /api/items
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { title, type, flowId, stageId, clientId, value, priority, responsibleId, slaDueAt } = req.body;

        if (!title || !flowId || !stageId) {
            res.status(400).json({ error: 'Título, fluxo e etapa são obrigatórios' });
            return;
        }

        const item = await prisma.operatingItem.create({
            data: {
                title,
                type: type || 'task',
                flowId,
                stageId,
                clientId: clientId || null,
                value: value ? parseFloat(value) : null,
                priority: priority || 'medium',
                responsibleId: responsibleId || null,
                slaDueAt: slaDueAt ? new Date(slaDueAt) : null,
            },
            include: { client: true, responsible: true, stage: true, flow: true },
        });

        // Create history entry
        await prisma.itemHistory.create({
            data: {
                action: 'created',
                toStage: stageId,
                note: `Item criado: ${title}`,
                itemId: item.id,
            },
        });

        res.status(201).json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar item' });
    }
});

// PUT /api/items/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const item = await prisma.operatingItem.update({
            where: { id: req.params.id },
            data: {
                title: req.body.title,
                type: req.body.type,
                value: req.body.value !== undefined ? parseFloat(req.body.value) : undefined,
                priority: req.body.priority,
                status: req.body.status,
                clientId: req.body.clientId,
                responsibleId: req.body.responsibleId,
                slaDueAt: req.body.slaDueAt ? new Date(req.body.slaDueAt) : undefined,
            },
            include: { client: true, responsible: true, stage: true, flow: true },
        });

        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
});

// PATCH /api/items/:id/move
router.patch('/:id/move', async (req: AuthRequest, res) => {
    try {
        const { stageId } = req.body;
        if (!stageId) { res.status(400).json({ error: 'stageId é obrigatório' }); return; }

        const currentItem = await prisma.operatingItem.findUnique({
            where: { id: req.params.id },
        });

        if (!currentItem) { res.status(404).json({ error: 'Item não encontrado' }); return; }

        const item = await prisma.operatingItem.update({
            where: { id: req.params.id },
            data: { stageId },
            include: { client: true, responsible: true, stage: true, flow: true },
        });

        // Create history entry for movement
        await prisma.itemHistory.create({
            data: {
                action: 'moved',
                fromStage: currentItem.stageId,
                toStage: stageId,
                note: `Item movido para ${item.stage.name}`,
                itemId: item.id,
            },
        });

        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao mover item' });
    }
});

// DELETE /api/items/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        await prisma.operatingItem.delete({ where: { id: req.params.id } });
        res.json({ message: 'Item removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover item' });
    }
});

export default router;
