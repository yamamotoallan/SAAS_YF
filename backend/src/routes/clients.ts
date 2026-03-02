import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';
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

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [clientsRaw, total] = await Promise.all([
            prisma.client.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                include: {
                    items: {
                        select: { value: true, status: true, updatedAt: true }
                    }
                },
                skip,
                take: limit,
            }),
            prisma.client.count({ where })
        ]);

        const clients = clientsRaw.map(client => {
            const ltv = client.items
                .filter(i => i.status === 'won')
                .reduce((sum, item) => sum + (Number(item.value) || 0), 0);

            const lastActivity = client.items.reduce((latest, item) => {
                const itemDate = new Date(item.updatedAt);
                return itemDate > latest ? itemDate : latest;
            }, new Date(client.createdAt));

            const daysSinceLastActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

            // Simplified Health for list
            const healthScore = Math.min(100, (ltv / 5000) * 50 + (daysSinceLastActivity < 30 ? 50 : 0));

            return {
                ...client,
                ltv,
                healthScore,
                daysSinceLastActivity,
                itemsCount: client.items.length
            };
        });

        res.json({
            data: clients,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

// GET /api/clients/:id/intelligence
router.get('/:id/intelligence', async (req: AuthRequest, res) => {
    try {
        const clientId = req.params.id as string;
        const client = await prisma.client.findFirst({
            where: { id: clientId, companyId: req.companyId as string },
            include: {
                items: {
                    include: { flow: true, stage: true }
                }
            }
        });

        if (!client) { res.status(404).json({ error: 'Cliente não encontrado' }); return; }

        // LTV Calculation
        const ltv = client.items
            .filter(i => i.status === 'won')
            .reduce((sum, item) => sum + (Number(item.value) || 0), 0);

        // Health Score Components
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        const recentItems = client.items.filter(i => i.createdAt >= sixMonthsAgo);
        const uniqueFlows = new Set(client.items.map(i => i.flowId));

        // 1. Frequency (Last 6 months)
        const frequencyScore = Math.min(100, (recentItems.length / 3) * 100);

        // 2. SLA Compliance
        const itemsWithSla = client.items.filter(i => i.slaDueAt);
        const slaCompliant = itemsWithSla.filter(i => !i.slaDueAt || new Date(i.slaDueAt) > (i.closedAt ? new Date(i.closedAt) : now));
        const slaScore = itemsWithSla.length > 0 ? (slaCompliant.length / itemsWithSla.length) * 100 : 100;

        // 3. Volume Score
        const volumeScore = Math.min(100, (ltv / 10000) * 100);

        // 4. Diversity (Usage of different flows)
        const diversityScore = Math.min(100, (uniqueFlows.size / 2) * 100);

        const healthScore = Math.round((frequencyScore * 0.25) + (slaScore * 0.25) + (volumeScore * 0.25) + (diversityScore * 0.25));

        // Churn Risk
        const lastActivity = client.items.reduce((latest, item) => {
            const itemDate = new Date(item.updatedAt);
            return itemDate > latest ? itemDate : latest;
        }, new Date(client.createdAt));

        const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        let churnRisk = 'low';
        if (daysSinceLastActivity > 45) churnRisk = 'high';
        else if (daysSinceLastActivity > 15) churnRisk = 'medium';

        res.json({
            ltv,
            healthScore,
            churnRisk,
            daysSinceLastActivity,
            metrics: {
                frequencyScore,
                slaScore,
                volumeScore,
                diversityScore
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao calcular inteligência do cliente' });
    }
});

// GET /api/clients/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const client = await prisma.client.findFirst({
            where: { id: req.params.id as string, companyId: req.companyId as string },
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
        const before = await prisma.client.findFirst({ where: { id: req.params.id as string, companyId: req.companyId as string } });
        if (!before) { res.status(404).json({ error: 'Cliente não encontrado' }); return; }

        const { name, type, email, phone, segment, status } = req.body;
        await prisma.client.update({
            where: { id: req.params.id as string },
            data: { name, type, email, phone, segment, status }
        });
        const updated = await prisma.client.findUnique({ where: { id: req.params.id as string } });

        logActivity({ action: 'updated', module: 'client', entityId: req.params.id as string, entityName: before.name, details: { changes: req.body }, companyId: req.companyId!, userId: req.userId });

        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.ACTIVE_CLIENTS_COUNT);

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// DELETE /api/clients/:id
router.delete('/:id', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const client = await prisma.client.findFirst({ where: { id: req.params.id as string, companyId: req.companyId as string } });
        await prisma.client.deleteMany({ where: { id: req.params.id as string, companyId: req.companyId as string } });

        logActivity({ action: 'deleted', module: 'client', entityId: req.params.id as string, entityName: client?.name || req.params.id as string, companyId: req.companyId!, userId: req.userId });

        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.ACTIVE_CLIENTS_COUNT);

        res.json({ message: 'Cliente removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover cliente' });
    }
});

export default router;
