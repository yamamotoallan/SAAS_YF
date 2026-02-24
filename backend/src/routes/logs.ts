import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/logs
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { module, action, limit: limitQuery, page: pageQuery, days } = req.query;
        const where: any = { companyId: req.companyId };

        if (module && module !== 'all') where.module = module;
        if (action && action !== 'all') where.action = action;

        if (days) {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - parseInt(days as string));
            where.createdAt = { gte: dateLimit };
        }

        const page = parseInt(pageQuery as string) || 1;
        const limit = parseInt(limitQuery as string) || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
});

export default router;
