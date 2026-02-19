// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest, checkRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/rules
router.get('/', async (req: AuthRequest, res) => {
    try {
        const rules = await prisma.businessRule.findMany({
            where: { companyId: req.companyId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(rules);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar regras' });
    }
});

// POST /api/rules (Admin only)
router.post('/', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const { name, entity, metric, operator, value, actionType, priority } = req.body;

        if (!name || !entity || !metric || !operator || value === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        const rule = await prisma.businessRule.create({
            data: {
                name,
                entity,
                metric,
                operator,
                value: Number(value),
                actionType: actionType || 'alert',
                priority: priority || 'medium',
                companyId: req.companyId!,
            },
        });

        res.status(201).json(rule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar regra' });
    }
});

// DELETE /api/rules/:id (Admin only)
router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        await prisma.businessRule.deleteMany({
            where: { id, companyId: req.companyId },
        });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir regra' });
    }
});

export default router;
