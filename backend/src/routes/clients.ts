// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../lib/log';
import { GoalsService, METRIC_TYPES } from '../services/goalsService';

const router = Router();

// GET /api/clients
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { search, status } = req.query;
        const where: any = { companyId: req.companyId };

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
            ];
        }
        if (status && status !== 'all') {
            where.status = status;
        }

        const clients = await prisma.client.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { items: true } } },
        });

        res.json(clients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

// GET /api/clients/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const client = await prisma.client.findFirst({
            where: { id: req.params.id, companyId: req.companyId },
            include: { items: { include: { flow: true, stage: true } } },
        });

        if (!client) { res.status(404).json({ error: 'Cliente não encontrado' }); return; }
        res.json(client);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
});

// POST /api/clients
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { name, type, email, phone, segment, status } = req.body;

        if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }

        const client = await prisma.client.create({
            data: {
                name,
                type: type || 'PJ',
                email: email || null,
                phone: phone || null,
                segment: segment || null,
                status: status || 'prospect',
                companyId: req.companyId!,
            },
        });

        logActivity({ action: 'created', module: 'client', entityId: client.id, entityName: client.name, companyId: req.companyId!, userId: req.userId });

        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.ACTIVE_CLIENTS_COUNT);

        res.status(201).json(client);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
});

// PUT /api/clients/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const before = await prisma.client.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        if (!before) { res.status(404).json({ error: 'Cliente não encontrado' }); return; }

        await prisma.client.update({ where: { id: req.params.id }, data: req.body });
        const updated = await prisma.client.findUnique({ where: { id: req.params.id } });

        logActivity({ action: 'updated', module: 'client', entityId: req.params.id, entityName: before.name, details: { changes: req.body }, companyId: req.companyId!, userId: req.userId });

        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.ACTIVE_CLIENTS_COUNT);

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const client = await prisma.client.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        await prisma.client.deleteMany({ where: { id: req.params.id, companyId: req.companyId } });

        logActivity({ action: 'deleted', module: 'client', entityId: req.params.id, entityName: client?.name || req.params.id, companyId: req.companyId!, userId: req.userId });

        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.ACTIVE_CLIENTS_COUNT);

        res.json({ message: 'Cliente removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover cliente' });
    }
});

export default router;
