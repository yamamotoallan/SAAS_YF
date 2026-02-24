import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';
import { logActivity } from '../lib/log';
import { GoalsService, METRIC_TYPES } from '../services/goalsService';
import { RulesService } from '../services/rules';

const router = Router();

// GET /api/financial
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { type, period } = req.query;
        const companyId = req.companyId as string;
        const where: any = { companyId };

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

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [entries, total] = await Promise.all([
            prisma.financialEntry.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: limit
            }),
            prisma.financialEntry.count({ where })
        ]);

        res.json({
            data: entries,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar lançamentos' });
    }
});

// GET /api/financial/summary
router.get('/summary', async (req: AuthRequest, res) => {
    try {
        const companyId = req.companyId as string;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const currentEntries = await prisma.financialEntry.findMany({ where: { companyId, date: { gte: startOfMonth, lte: endOfMonth } } });

        const revenue = currentEntries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
        const costs = currentEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
        const investments = currentEntries.filter(e => e.type === 'investment').reduce((s, e) => s + Number(e.value || 0), 0);
        const margin = revenue > 0 ? Math.round(((revenue - costs) / revenue) * 100) : 0;

        // Trends & Anomalies (Comparing with last 3 months)
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const historyEntries = await prisma.financialEntry.findMany({
            where: { companyId, date: { gte: threeMonthsAgo, lt: startOfMonth } }
        });

        const avgMonthlyCost = historyEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0) / 3;

        // Detailed Anomaly Detection per Category
        const categories = [...new Set(currentEntries.map(e => e.category))];
        const anomalies = categories.map(cat => {
            const currentCatCost = currentEntries.filter(e => e.category === cat && (e.type === 'cost' || e.type === 'EXPENSE')).reduce((s, e) => s + Number(e.value || 0), 0);
            const historyCatCost = historyEntries.filter(e => e.category === cat && (e.type === 'cost' || e.type === 'EXPENSE')).reduce((s, e) => s + Number(e.value || 0), 0) / 3;

            if (historyCatCost > 0 && currentCatCost > historyCatCost * 1.3) {
                return { category: cat, current: currentCatCost, average: Math.round(historyCatCost), impact: 'high' };
            }
            return null;
        }).filter(a => a !== null);

        const allEntries = await prisma.financialEntry.findMany({ where: { companyId } });
        const totalRevAll = allEntries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
        const totalCostAll = allEntries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
        const cashAvailable = totalRevAll - totalCostAll;

        res.json({
            revenue,
            costs,
            investments,
            margin,
            cashAvailable,
            anomalies,
            burnRate: Math.round(avgMonthlyCost),
            operatingMonths: cashAvailable > 0 && avgMonthlyCost > 0 ? Math.floor(cashAvailable / avgMonthlyCost) : 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
    }
});

// GET /api/financial/projection
router.get('/projection', async (req: AuthRequest, res) => {
    try {
        const companyId = req.companyId as string;
        const now = new Date();

        // Fetch all entries to calculate current cash and recurring base
        const entries = await prisma.financialEntry.findMany({ where: { companyId } });

        const totalRevenue = entries.filter(e => e.type === 'revenue' || e.type === 'INCOME').reduce((s, e) => s + Number(e.value || 0), 0);
        const totalCosts = entries.filter(e => e.type === 'cost' || e.type === 'EXPENSE').reduce((s, e) => s + Number(e.value || 0), 0);
        let currentCash = totalRevenue - totalCosts;

        const recurringRevenue = entries.filter(e => (e.type === 'revenue' || e.type === 'INCOME') && e.recurring).reduce((s, e) => s + Number(e.value || 0), 0);
        const recurringCosts = entries.filter(e => (e.type === 'cost' || e.type === 'EXPENSE') && e.recurring).reduce((s, e) => s + Number(e.value || 0), 0);

        const projection = [];
        for (let i = 1; i <= 6; i++) {
            const projDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            currentCash += (recurringRevenue - recurringCosts);
            projection.push({
                month: projDate.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
                balance: Math.round(currentCash),
                revenue: recurringRevenue,
                costs: recurringCosts
            });
        }

        res.json(projection);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar projeção financeira' });
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

        // Sync Goals
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.FINANCIAL_REVENUE_MONTH);
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.FINANCIAL_PROFIT_MONTH);

        // Evaluate Rules
        RulesService.evaluate({
            companyId: req.companyId!,
            entity: 'financial',
            data: entry
        });

        res.status(201).json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar lançamento' });
    }
});

// PUT /api/financial/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const before = await prisma.financialEntry.findFirst({ where: { id: req.params.id as string, companyId: req.companyId } });
        if (!before) { res.status(404).json({ error: 'Lançamento não encontrado' }); return; }

        await prisma.financialEntry.update({
            where: { id: req.params.id as string },
            data: {
                type: req.body.type, category: req.body.category, description: req.body.description,
                value: req.body.value !== undefined ? parseFloat(req.body.value) : undefined,
                date: req.body.date ? new Date(req.body.date) : undefined,
                recurring: req.body.recurring,
            },
        });

        const updated = await prisma.financialEntry.findUnique({ where: { id: req.params.id as string } });
        logActivity({ action: 'updated', module: 'financial', entityId: req.params.id as string, entityName: before.description, details: { changes: req.body }, companyId: req.companyId as string, userId: req.userId as string });

        // Sync Goals
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.FINANCIAL_REVENUE_MONTH);
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.FINANCIAL_PROFIT_MONTH);

        // Evaluate Rules
        if (updated) {
            RulesService.evaluate({
                companyId: req.companyId!,
                entity: 'financial',
                data: updated
            });
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar lançamento' });
    }
});

// DELETE /api/financial/:id
router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
        const entry = await prisma.financialEntry.findFirst({ where: { id: req.params.id as string, companyId: req.companyId } });
        await prisma.financialEntry.deleteMany({ where: { id: req.params.id as string, companyId: req.companyId } });

        logActivity({ action: 'deleted', module: 'financial', entityId: req.params.id as string, entityName: entry?.description || req.params.id as string, companyId: req.companyId as string, userId: req.userId as string });

        // Sync Goals
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.FINANCIAL_REVENUE_MONTH);
        await GoalsService.syncMetrics(req.companyId!, METRIC_TYPES.FINANCIAL_PROFIT_MONTH);

        res.json({ message: 'Lançamento removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover lançamento' });
    }
});

export default router;
