import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest, checkRole } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/rules
router.get('/', async (req: AuthRequest, res) => {
    try {
        const rules = await prisma.businessRule.findMany({
            where: { companyId: req.companyId as string },
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

// PUT /api/rules/:id (Admin only)
router.put('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const before = await prisma.businessRule.findFirst({
            where: { id: id as string, companyId: req.companyId as string },
        });
        if (!before) { res.status(404).json({ error: 'Regra não encontrada' }); return; }

        const { name, description, entity, metric, operator, value, actionType, priority, isActive } = req.body;
        const updated = await prisma.businessRule.update({
            where: { id: id as string },
            data: {
                name, description, entity, metric, operator,
                value: value !== undefined ? Number(value) : undefined,
                actionType, priority,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar regra' });
    }
});

// DELETE /api/rules/:id (Admin only)
router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        await prisma.businessRule.deleteMany({
            where: { id: id as string, companyId: req.companyId as string },
        });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir regra' });
    }
});

export default router;
