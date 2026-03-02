import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';
import { logActivity } from '../lib/log';
import { GoalsService } from '../services/goalsService';

const router = Router();

// POST /api/goals/sync
router.post('/sync', async (req: AuthRequest, res) => {
    try {
        await GoalsService.syncMetrics(req.companyId!);
        res.json({ message: 'Indicadores sincronizados com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao sincronizar indicadores' });
    }
});

// GET /api/goals
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { period, type } = req.query;
        const where: any = { companyId: req.companyId };

        if (period && period !== 'all') where.period = period;
        if (type && type !== 'all') where.type = type;

        const goals = await prisma.goal.findMany({
            where,
            include: {
                keyResults: true,
                owner: { select: { id: true, name: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate progress for each goal based on key results
        const goalsWithProgress = goals.map(goal => {
            if (goal.keyResults.length === 0) return goal;

            const totalProgress = goal.keyResults.reduce((sum, kr) => {
                const krProgress = Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100));
                return sum + krProgress;
            }, 0);

            return { ...goal, progress: Math.round(totalProgress / goal.keyResults.length) };
        });

        res.json(goalsWithProgress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar metas' });
    }
});

// POST /api/goals
router.post('/', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const { title, description, type, period, ownerId, keyResults } = req.body;

        if (!title || !type || !period) {
            res.status(400).json({ error: 'Título, tipo e período são obrigatórios' });
            return;
        }

        const goal = await prisma.goal.create({
            data: {
                title, description, type, period,
                ownerId: ownerId || null,
                companyId: req.companyId!,
                keyResults: {
                    create: keyResults?.map((kr: any) => ({
                        title: kr.title,
                        targetValue: parseFloat(kr.targetValue),
                        initialValue: parseFloat(kr.initialValue || 0),
                        currentValue: parseFloat(kr.currentValue || kr.initialValue || 0),
                        unit: kr.unit,
                        linkedIndicator: kr.linkedIndicator
                    }))
                }
            },
            include: { keyResults: true }
        });

        logActivity({
            action: 'created',
            module: 'goals',
            entityId: goal.id,
            entityName: title,
            details: { type, period, krs: keyResults?.length },
            companyId: req.companyId!,
            userId: req.userId
        });

        res.status(201).json(goal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar meta' });
    }
});

// PUT /api/goals/:id
router.put('/:id', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const { title, description, status, ownerId } = req.body;
        const goal = await prisma.goal.update({
            where: { id: req.params.id as string },
            data: { title, description, status, ownerId },
            include: { keyResults: true }
        });

        logActivity({
            action: 'updated',
            module: 'goals',
            entityId: goal.id,
            entityName: goal.title,
            details: { changes: req.body },
            companyId: req.companyId!,
            userId: req.userId
        });

        res.json(goal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar meta' });
    }
});

// DELETE /api/goals/:id
router.delete('/:id', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const goal = await prisma.goal.findUnique({ where: { id: req.params.id as string } });
        await prisma.goal.delete({ where: { id: req.params.id as string } });

        logActivity({
            action: 'deleted',
            module: 'goals',
            entityId: req.params.id as string,
            entityName: goal?.title || 'Meta',
            companyId: req.companyId as string,
            userId: req.userId as string
        });

        res.json({ message: 'Meta removida com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover meta' });
    }
});

// POST /api/goals/:id/key-results
router.post('/:id/key-results', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const { title, targetValue, unit, linkedIndicator } = req.body;

        const kr = await prisma.keyResult.create({
            data: {
                goalId: req.params.id as string,
                title,
                targetValue: parseFloat(targetValue),
                unit,
                linkedIndicator
            }
        });

        res.status(201).json(kr);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao adicionar resultado-chave' });
    }
});

// PUT /api/goals/key-results/:id
router.put('/key-results/:id', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const { currentValue } = req.body;

        const kr = await prisma.keyResult.update({
            where: { id: req.params.id as string },
            data: { currentValue: parseFloat(currentValue) }
        });

        // Trigger Log for progress update
        // We could also trigger recalculation of goal progress here or let the GET endpoint handle it

        res.json(kr);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar resultado-chave' });
    }
});

export default router;
