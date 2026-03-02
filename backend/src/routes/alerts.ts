import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';
import { logActivity } from '../lib/log';

const router = Router();

// GET /api/alerts
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { status, type } = req.query;
        const where: any = { companyId: req.companyId };

        if (status && status !== 'all') {
            where.status = status === 'history' ? { in: ['resolved', 'dismissed'] } : status;
        } else {
            where.status = 'active';
        }
        if (type && type !== 'all') where.type = type;

        const alerts = await prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json(alerts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar alertas' });
    }
});

// POST /api/alerts
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { title, description, type, priority } = req.body;
        if (!title || !description) {
            res.status(400).json({ error: 'Título e descrição são obrigatórios' });
            return;
        }

        const alert = await prisma.alert.create({
            data: {
                title, description,
                type: type || 'operational',
                priority: priority || 'medium',
                companyId: req.companyId!,
                userId: req.userId,
            },
        });

        logActivity({ action: 'created', module: 'alert', entityId: alert.id as string, entityName: title, details: { type, priority }, companyId: req.companyId as string, userId: req.userId as string });
        res.status(201).json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar alerta' });
    }
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.alert.findFirst({ where: { id: req.params.id as string, companyId: req.companyId as string } });
        if (!existing) { res.status(404).json({ error: 'Alerta não encontrado' }); return; }

        await prisma.alert.update({ where: { id: req.params.id as string }, data: { status: 'resolved', resolvedAt: new Date() } });
        const updated = await prisma.alert.findUnique({ where: { id: req.params.id as string } });

        logActivity({ action: 'resolved', module: 'alert', entityId: req.params.id as string, entityName: existing.title, companyId: req.companyId as string, userId: req.userId as string });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao resolver alerta' });
    }
});

// PATCH /api/alerts/:id/dismiss
router.patch('/:id/dismiss', async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.alert.findFirst({ where: { id: req.params.id as string, companyId: req.companyId as string } });
        if (!existing) { res.status(404).json({ error: 'Alerta não encontrado' }); return; }

        await prisma.alert.update({ where: { id: req.params.id as string }, data: { status: 'dismissed' } });
        const updated = await prisma.alert.findUnique({ where: { id: req.params.id as string } });

        logActivity({ action: 'dismissed', module: 'alert', entityId: req.params.id as string, entityName: existing.title, companyId: req.companyId as string, userId: req.userId as string });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao dispensar alerta' });
    }
});

// DELETE /api/alerts/:id
router.delete('/:id', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const alert = await prisma.alert.findFirst({ where: { id: req.params.id as string, companyId: req.companyId as string } });
        await prisma.alert.deleteMany({ where: { id: req.params.id as string, companyId: req.companyId as string } });

        logActivity({ action: 'deleted', module: 'alert', entityId: req.params.id as string, entityName: alert?.title || (req.params.id as string), companyId: req.companyId as string, userId: req.userId as string });
        res.json({ message: 'Alerta removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover alerta' });
    }
});

export default router;
