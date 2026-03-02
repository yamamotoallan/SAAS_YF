import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';
import { logActivity } from '../lib/log';
import { RulesService } from '../services/rules';

const router = Router();

// GET /api/kpis
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { category, status } = req.query;
        const where: any = { companyId: req.companyId as string };
        if (category && category !== 'all') where.category = category as string;
        if (status && status !== 'all') where.status = status as string;

        const kpis = await prisma.kPI.findMany({ where, orderBy: { category: 'asc' } });
        res.json(kpis);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
});

// POST /api/kpis
router.post('/', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
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

        logActivity({ action: 'created', module: 'kpi', entityId: kpi.id as string, entityName: `${name} (${category})`, details: { value, target, unit }, companyId: req.companyId as string, userId: req.userId as string });
        res.status(201).json(kpi);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar KPI' });
    }
});

// PUT /api/kpis/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const before = await prisma.kPI.findFirst({ where: { id: req.params.id as string, companyId: req.companyId as string } });
        if (!before) { res.status(404).json({ error: 'KPI não encontrado' }); return; }

        const { name, category, value, target, unit, trend, status } = req.body;
        await prisma.kPI.update({
            where: { id: req.params.id as string },
            data: {
                name, category: category as string,
                value: value !== undefined ? parseFloat(value) : undefined,
                target: target !== undefined ? parseFloat(target) : undefined,
                unit, trend, status,
            },
        });

        const updated = await prisma.kPI.findUnique({ where: { id: req.params.id as string } });

        // Trigger Oracle Rule Analysis
        if (updated) {
            await RulesService.evaluate({
                companyId: req.companyId!,
                entity: updated.category.toLowerCase() === 'pessoas' ? 'people' : updated.category.toLowerCase(),
                data: { ...updated, score: updated.value } // Map value to score for climate rules
            });
        }

        logActivity({ action: 'updated', module: 'kpi', entityId: req.params.id as string, entityName: before.name, details: { changes: req.body }, companyId: req.companyId as string, userId: req.userId as string });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar KPI' });
    }
});

// DELETE /api/kpis/:id
router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const kpi = await prisma.kPI.findFirst({ where: { id: req.params.id as string, companyId: req.companyId as string } });
        await prisma.kPI.deleteMany({ where: { id: req.params.id as string, companyId: req.companyId as string } });

        logActivity({ action: 'deleted', module: 'kpi', entityId: req.params.id as string, entityName: kpi?.name || (req.params.id as string), companyId: req.companyId as string, userId: req.userId as string });
        res.json({ message: 'KPI removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover KPI' });
    }
});

export default router;
