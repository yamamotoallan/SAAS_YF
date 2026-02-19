// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ActionPlanService } from '../services/actionPlanService';

const router = Router();

// GET /api/process-blocks
router.get('/', async (req: AuthRequest, res) => {
    try {
        const blocks = await prisma.processBlock.findMany({
            where: { companyId: req.companyId },
            include: { processes: { orderBy: { code: 'asc' } } },
            orderBy: { order: 'asc' },
        });

        res.json(blocks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar processos' });
    }
});

// POST /api/process-blocks
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { name, type, order, processes } = req.body;

        const block = await prisma.processBlock.create({
            data: {
                name,
                type,
                order: order || 0,
                companyId: req.companyId!,
                processes: processes ? {
                    create: processes.map((p: any) => ({
                        code: p.code,
                        name: p.name,
                        status: p.status || 'none',
                        responsible: p.responsible || false,
                        frequency: p.frequency || 'never',
                        observation: p.observation || null,
                    })),
                } : undefined,
            },
            include: { processes: true },
        });

        res.status(201).json(block);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar bloco de processos' });
    }
});

// PUT /api/process-items/:id
router.put('/items/:id', async (req: AuthRequest, res) => {
    try {
        const { status, responsible, frequency, observation } = req.body;

        const processItem = await prisma.processItem.update({
            where: { id: req.params.id },
            data: {
                status,
                responsible,
                frequency,
                observation,
            },
        });

        res.json(processItem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar processo' });
    }
});

// GET /api/process-blocks/diagnosis
router.get('/diagnosis', async (req: AuthRequest, res) => {
    try {
        const blocks = await prisma.processBlock.findMany({
            where: { companyId: req.companyId },
            include: { processes: true },
            orderBy: { order: 'asc' },
        });

        // Calculate scores per block
        const blockScores = blocks.map(block => {
            const total = block.processes.length;
            if (total === 0) return { ...block, score: 0 };

            let points = 0;
            block.processes.forEach(p => {
                if (p.status === 'formal') points += 3;
                else if (p.status === 'informal') points += 1;
                if (p.responsible) points += 1;
                if (p.frequency === 'periodic') points += 1;
                else if (p.frequency === 'eventual') points += 0.5;
            });

            const maxPoints = total * 5; // 3 (formal) + 1 (responsible) + 1 (periodic)
            const score = Math.round((points / maxPoints) * 100);

            return {
                id: block.id,
                name: block.name,
                type: block.type,
                score,
                totalProcesses: total,
                formal: block.processes.filter(p => p.status === 'formal').length,
                informal: block.processes.filter(p => p.status === 'informal').length,
                none: block.processes.filter(p => p.status === 'none').length,
            };
        });

        // Overall diagnosis
        const avgScore = blockScores.length > 0
            ? Math.round(blockScores.reduce((sum, b) => sum + b.score, 0) / blockScores.length)
            : 0;

        const weaknesses = blockScores.filter(b => b.score < 50).length;

        let overallStatus = 'Empresa Saudável';
        let statusClass = 'success';
        if (weaknesses > 2) {
            overallStatus = 'Empresa em Risco';
            statusClass = 'danger';
        } else if (weaknesses > 0) {
            overallStatus = 'Empresa em Transição';
            statusClass = 'warning';
        }

        // Critical risks
        const allProcesses = blocks.flatMap(b => b.processes);
        const criticalCodes = ['D02', 'F05', 'P04', 'G03', 'O05'];
        const criticalRisks = allProcesses.filter(
            p => (p.status === 'none' || p.status === 'informal') && criticalCodes.includes(p.code)
        );

        res.json({
            overallScore: avgScore,
            overallStatus,
            statusClass,
            blockScores,
            criticalRisks,
            strengths: blockScores.filter(b => b.score >= 70).map(b => b.name),
            weaknesses: blockScores.filter(b => b.score < 50).map(b => b.name),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar diagnóstico' });
    }
});

// GET /api/process-blocks/actions
router.get('/actions', async (req: AuthRequest, res) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.companyId },
            select: { segment: true } // Fetch segment
        });

        const blocks = await prisma.processBlock.findMany({
            where: { companyId: req.companyId },
            include: { processes: true },
        });

        const allProcesses = blocks.flatMap(b => b.processes);
        const segment = company?.segment;

        const suggestions = allProcesses
            .filter(p => p.status === 'none' || p.status === 'informal')
            .map(p => {
                const template = ActionPlanService.getTemplate(p.code, segment);

                return {
                    processId: p.id,
                    processName: p.name,
                    code: p.code,
                    status: p.status,
                    actionTitle: template.title,
                    actionStep: template.step,
                    suggestedTool: template.tool,
                    priority: (p.status === 'none') ? 'High' : 'Medium'
                };
            });

        res.json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar plano de ação' });
    }
});

export default router;
