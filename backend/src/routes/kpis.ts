// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../lib/log';

const router = Router();

// GET /api/kpis
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { category, status } = req.query;
        const where: any = { companyId: req.companyId };
        if (category && category !== 'all') where.category = category;
        if (status && status !== 'all') where.status = status;

        const kpis = await prisma.kPI.findMany({ where, orderBy: { category: 'asc' } });
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
                name, category,
                value: parseFloat(value) || 0,
                target: parseFloat(target) || 0,
                unit: unit || '%',
                trend: trend || 'stable',
                status: status || 'success',
                companyId: req.companyId!,
            },
        });

        logActivity({ action: 'created', module: 'kpi', entityId: kpi.id, entityName: `${name} (${category})`, details: { value, target, unit }, companyId: req.companyId!, userId: req.userId });
        res.status(201).json(kpi);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar KPI' });
    }
});

// PUT /api/kpis/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const before = await prisma.kPI.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        if (!before) { res.status(404).json({ error: 'KPI não encontrado' }); return; }

        await prisma.kPI.update({
            where: { id: req.params.id },
            data: {
                name: req.body.name, category: req.body.category,
                value: req.body.value !== undefined ? parseFloat(req.body.value) : undefined,
                target: req.body.target !== undefined ? parseFloat(req.body.target) : undefined,
                unit: req.body.unit, trend: req.body.trend, status: req.body.status,
            },
        });

        const updated = await prisma.kPI.findUnique({ where: { id: req.params.id } });
        logActivity({ action: 'updated', module: 'kpi', entityId: req.params.id, entityName: before.name, details: { changes: req.body }, companyId: req.companyId!, userId: req.userId });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar KPI' });
    }
});

// DELETE /api/kpis/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const kpi = await prisma.kPI.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        await prisma.kPI.deleteMany({ where: { id: req.params.id, companyId: req.companyId } });

        logActivity({ action: 'deleted', module: 'kpi', entityId: req.params.id, entityName: kpi?.name || req.params.id, companyId: req.companyId!, userId: req.userId });
        res.json({ message: 'KPI removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover KPI' });
    }
});

export default router;
