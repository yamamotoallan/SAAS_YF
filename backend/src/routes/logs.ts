// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/logs
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { module, action, limit } = req.query;
        const where: any = { companyId: req.companyId };

        if (module && module !== 'all') where.module = module;
        if (action && action !== 'all') where.action = action;

        const logs = await prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string) || 100,
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
});

export default router;
