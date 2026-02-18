// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/kpis
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { category, status } = req.query;
        const where: any = { companyId: req.companyId };

        if (category && category !== 'all') where.category = category;
        if (status && status !== 'all') where.status = status;

        const kpis = await prisma.kPI.findMany({
            where,
            orderBy: { category: 'asc' },
        });

        res.json(kpis);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
});

// POST /api/kpis
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { name, category, value, target, unit, trend, status } = req.body;

        if (!name || !category) {
            res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
            return;
        }

        const kpi = await prisma.kPI.create({
            data: {
                name,
                category,
                value: parseFloat(value) || 0,
                target: parseFloat(target) || 0,
                unit: unit || '%',
                trend: trend || 'stable',
                status: status || 'success',
                companyId: req.companyId!,
            },
        });

        res.status(201).json(kpi);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar KPI' });
    }
});

// PUT /api/kpis/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const kpi = await prisma.kPI.updateMany({
            where: { id: req.params.id, companyId: req.companyId },
            data: {
                name: req.body.name,
                category: req.body.category,
                value: req.body.value !== undefined ? parseFloat(req.body.value) : undefined,
                target: req.body.target !== undefined ? parseFloat(req.body.target) : undefined,
                unit: req.body.unit,
                trend: req.body.trend,
                status: req.body.status,
            },
        });

        if (kpi.count === 0) { res.status(404).json({ error: 'KPI não encontrado' }); return; }

        const updated = await prisma.kPI.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar KPI' });
    }
});

// DELETE /api/kpis/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        await prisma.kPI.deleteMany({
            where: { id: req.params.id, companyId: req.companyId },
        });
        res.json({ message: 'KPI removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover KPI' });
    }
});

export default router;
