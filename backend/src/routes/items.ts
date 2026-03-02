import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';
import { GoalsService, METRIC_TYPES } from '../services/goalsService';
import { logActivity } from '../lib/log';

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
            where: { id: req.params.id as string },
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

        // Sync Metrics
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_COUNT_MONTH);
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_VALUE_MONTH);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar item' });
    }
});

// PUT /api/items/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const { title, type, value, priority, status, clientId, responsibleId, slaDueAt } = req.body;
        const item = await prisma.operatingItem.update({
            where: { id: req.params.id as string },
            data: {
                title,
                type,
                value: value !== undefined ? parseFloat(value) : undefined,
                priority,
                status,
                clientId,
                responsibleId,
                slaDueAt: slaDueAt ? new Date(slaDueAt) : undefined,
            },
            include: { client: true, responsible: true, stage: true, flow: true },
        });

        res.json(item);

        // Sync Metrics
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_COUNT_MONTH);
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_VALUE_MONTH);
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
            where: { id: req.params.id as string },
        });

        if (!currentItem) { res.status(404).json({ error: 'Item não encontrado' }); return; }

        const item = await prisma.operatingItem.update({
            where: { id: req.params.id as string },
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

// PATCH /api/items/:id/close  (status: 'won' | 'lost', lostReason?)
router.patch('/:id/close', async (req: AuthRequest, res) => {
    try {
        const { status, lostReason } = req.body;
        if (!['won', 'lost'].includes(status)) {
            res.status(400).json({ error: "status deve ser 'won' ou 'lost'" });
            return;
        }

        const item = await prisma.operatingItem.findUnique({
            where: { id: req.params.id as string },
            include: { client: true, flow: true },
        });
        if (!item) { res.status(404).json({ error: 'Item não encontrado' }); return; }
        if (item.status === 'won' || item.status === 'lost') {
            res.status(400).json({ error: 'Item já foi encerrado' });
            return;
        }

        // Update item status
        const updated = await prisma.operatingItem.update({
            where: { id: req.params.id as string },
            data: { status, closedAt: new Date() },
            include: { client: true, responsible: true, stage: true, flow: true },
        });

        // ── History ─────────────────────────────────────────────────
        await prisma.itemHistory.create({
            data: {
                action: status === 'won' ? 'won' : 'lost',
                note: status === 'won'
                    ? `Oportunidade encerrada como GANHA${item.value ? ` (R$ ${Number(item.value).toLocaleString('pt-BR')})` : ''}`
                    : `Oportunidade encerrada como PERDIDA${lostReason ? `: ${lostReason}` : ''}`,
                itemId: item.id,
            },
        });

        if (status === 'won') {
            // ── Auto Financial Entry ───────────────────────────────
            if (item.value && item.value > 0) {
                await prisma.financialEntry.create({
                    data: {
                        type: 'INCOME',
                        category: 'Vendas',
                        description: `[CRM] ${item.title}${item.client ? ` — ${item.client.name}` : ''}`,
                        value: item.value,
                        date: new Date(),
                        companyId: req.companyId!,
                    },
                });
            }

            logActivity({
                action: 'won',
                module: 'crm',
                entityId: item.id as string,
                entityName: item.title,
                details: { value: item.value },
                companyId: req.companyId as string,
                userId: req.userId as string,
            });

            // Sync OKR goals
            await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_COUNT_MONTH);
            await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_VALUE_MONTH);
            await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.FINANCIAL_REVENUE_MONTH);
        }

        if (status === 'lost') {
            // ── Auto Alert ────────────────────────────────────────
            await prisma.alert.create({
                data: {
                    title: `Oportunidade Perdida: ${item.title}`,
                    description: lostReason
                        ? `Motivo: ${lostReason}`
                        : `A oportunidade com ${item.client?.name || 'cliente desconhecido'} foi encerrada como perdida.`,
                    type: 'operational',
                    priority: 'high',
                    status: 'active',
                    companyId: req.companyId!,
                },
            });

            logActivity({
                action: 'lost',
                module: 'crm',
                entityId: item.id as string,
                entityName: item.title,
                details: { lostReason },
                companyId: req.companyId as string,
                userId: req.userId as string,
            });
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao encerrar item' });
    }
});

// DELETE /api/items/:id
router.delete('/:id', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        await prisma.operatingItem.delete({ where: { id: req.params.id as string } });

        // Sync Metrics
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_COUNT_MONTH);
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.SALES_WON_VALUE_MONTH);

        res.json({ message: 'Item removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover item' });
    }
});

export default router;
