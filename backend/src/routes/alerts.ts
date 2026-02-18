// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

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

        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

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
                title,
                description,
                type: type || 'operational',
                priority: priority || 'medium',
                companyId: req.companyId!,
                userId: req.userId,
            },
        });

        res.status(201).json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar alerta' });
    }
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req: AuthRequest, res) => {
    try {
        const alert = await prisma.alert.updateMany({
            where: { id: req.params.id, companyId: req.companyId },
            data: { status: 'resolved', resolvedAt: new Date() },
        });

        if (alert.count === 0) { res.status(404).json({ error: 'Alerta não encontrado' }); return; }

        const updated = await prisma.alert.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao resolver alerta' });
    }
});

// PATCH /api/alerts/:id/dismiss
router.patch('/:id/dismiss', async (req: AuthRequest, res) => {
    try {
        const alert = await prisma.alert.updateMany({
            where: { id: req.params.id, companyId: req.companyId },
            data: { status: 'dismissed' },
        });

        if (alert.count === 0) { res.status(404).json({ error: 'Alerta não encontrado' }); return; }

        const updated = await prisma.alert.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao dispensar alerta' });
    }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        await prisma.alert.deleteMany({
            where: { id: req.params.id, companyId: req.companyId },
        });
        res.json({ message: 'Alerta removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover alerta' });
    }
});

export default router;
