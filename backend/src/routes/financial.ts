// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../lib/log';

const router = Router();

// GET /api/financial
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { type, period } = req.query;
        const where: any = { companyId: req.companyId };

        if (type && type !== 'all') where.type = type;

        const now = new Date();
        if (period === 'month') {
            where.date = { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
        } else if (period === 'quarter') {
            const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            where.date = { gte: qStart, lte: now };
        } else if (period === 'year') {
            where.date = { gte: new Date(now.getFullYear(), 0, 1), lte: now };
        }

        const entries = await prisma.financialEntry.findMany({ where, orderBy: { date: 'desc' } });
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar lançamentos' });
    }
});

// GET /api/financial/summary
router.get('/summary', async (req: AuthRequest, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const entries = await prisma.financialEntry.findMany({ where: { companyId: req.companyId, date: { gte: startOfMonth, lte: endOfMonth } } });

        const revenue = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + e.value, 0);
        const costs = entries.filter(e => e.type === 'cost').reduce((s, e) => s + e.value, 0);
        const investments = entries.filter(e => e.type === 'investment').reduce((s, e) => s + e.value, 0);
        const margin = revenue > 0 ? Math.round(((revenue - costs) / revenue) * 100) : 0;

        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const prevEntries = await prisma.financialEntry.findMany({ where: { companyId: req.companyId, date: { gte: prevStart, lte: prevEnd } } });

        const prevRevenue = prevEntries.filter(e => e.type === 'revenue').reduce((s, e) => s + e.value, 0);
        const prevCosts = prevEntries.filter(e => e.type === 'cost').reduce((s, e) => s + e.value, 0);
        const revenueTrend = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
        const costTrend = prevCosts > 0 ? Math.round(((costs - prevCosts) / prevCosts) * 100) : 0;

        const allEntries = await prisma.financialEntry.findMany({ where: { companyId: req.companyId } });
        const totalRevenue = allEntries.filter(e => e.type === 'revenue').reduce((s, e) => s + e.value, 0);
        const totalCosts = allEntries.filter(e => e.type === 'cost').reduce((s, e) => s + e.value, 0);
        const cashAvailable = totalRevenue - totalCosts;

        res.json({ revenue, costs, investments, margin, cashAvailable, revenueTrend, costTrend, operatingMonths: cashAvailable > 0 && costs > 0 ? Math.floor(cashAvailable / costs) : 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
    }
});

// POST /api/financial
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { type, category, description, value, date, recurring } = req.body;

        if (!type || !category || !description || value === undefined) {
            res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            return;
        }

        const entry = await prisma.financialEntry.create({
            data: {
                type, category, description,
                value: parseFloat(value),
                date: new Date(date || Date.now()),
                recurring: recurring || false,
                companyId: req.companyId!,
            },
        });

        logActivity({ action: 'created', module: 'financial', entityId: entry.id, entityName: `${description} - R$ ${value}`, details: { type, category, value }, companyId: req.companyId!, userId: req.userId });
        res.status(201).json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar lançamento' });
    }
});

// PUT /api/financial/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const before = await prisma.financialEntry.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        if (!before) { res.status(404).json({ error: 'Lançamento não encontrado' }); return; }

        await prisma.financialEntry.update({
            where: { id: req.params.id },
            data: {
                type: req.body.type, category: req.body.category, description: req.body.description,
                value: req.body.value !== undefined ? parseFloat(req.body.value) : undefined,
                date: req.body.date ? new Date(req.body.date) : undefined,
                recurring: req.body.recurring,
            },
        });

        const updated = await prisma.financialEntry.findUnique({ where: { id: req.params.id } });
        logActivity({ action: 'updated', module: 'financial', entityId: req.params.id, entityName: before.description, details: { changes: req.body }, companyId: req.companyId!, userId: req.userId });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar lançamento' });
    }
});

// DELETE /api/financial/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const entry = await prisma.financialEntry.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        await prisma.financialEntry.deleteMany({ where: { id: req.params.id, companyId: req.companyId } });

        logActivity({ action: 'deleted', module: 'financial', entityId: req.params.id, entityName: entry?.description || req.params.id, companyId: req.companyId!, userId: req.userId });
        res.json({ message: 'Lançamento removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover lançamento' });
    }
});

export default router;
