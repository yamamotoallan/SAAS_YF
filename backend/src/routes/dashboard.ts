// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard
router.get('/', async (req: AuthRequest, res) => {
    try {
        const companyId = req.companyId!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Financial Summary
        const financialEntries = await prisma.financialEntry.findMany({
            where: { companyId, date: { gte: startOfMonth, lte: endOfMonth } },
        });
        const revenue = financialEntries.filter(e => e.type === 'revenue').reduce((s, e) => s + e.value, 0);
        const costs = financialEntries.filter(e => e.type === 'cost').reduce((s, e) => s + e.value, 0);
        const margin = revenue > 0 ? Math.round(((revenue - costs) / revenue) * 100) : 0;

        // All-time cash
        const allFinancial = await prisma.financialEntry.findMany({ where: { companyId } });
        const totalRev = allFinancial.filter(e => e.type === 'revenue').reduce((s, e) => s + e.value, 0);
        const totalCost = allFinancial.filter(e => e.type === 'cost').reduce((s, e) => s + e.value, 0);
        const cashAvailable = totalRev - totalCost;

        // People Summary
        const people = await prisma.person.findMany({ where: { companyId } });
        const headcount = people.filter(p => p.status === 'active').length;

        // Pipeline value
        const items = await prisma.operatingItem.findMany({
            where: { flow: { companyId }, status: 'active' },
        });
        const pipelineValue = items.reduce((s, i) => s + (i.value || 0), 0);
        const activeItems = items.length;

        // Active alerts
        const alerts = await prisma.alert.findMany({
            where: { companyId, status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Process maturity
        const processBlocks = await prisma.processBlock.findMany({
            where: { companyId },
            include: { processes: true },
        });

        let overallProcessScore = 0;
        if (processBlocks.length > 0) {
            const blockScores = processBlocks.map(block => {
                const total = block.processes.length;
                if (total === 0) return 0;
                let points = 0;
                block.processes.forEach(p => {
                    if (p.status === 'formal') points += 3;
                    else if (p.status === 'informal') points += 1;
                    if (p.responsible) points += 1;
                    if (p.frequency === 'periodic') points += 1;
                    else if (p.frequency === 'eventual') points += 0.5;
                });
                return Math.round((points / (total * 5)) * 100);
            });
            overallProcessScore = Math.round(blockScores.reduce((s, v) => s + v, 0) / blockScores.length);
        }

        // Operations metrics
        const flows = await prisma.operatingFlow.findMany({
            where: { companyId },
            include: {
                stages: { orderBy: { order: 'asc' } },
                items: { where: { status: 'active' } },
            },
        });

        // Calculate SGE Score (weighted)
        const financialScore = Math.min(100, margin * 2 + (revenue > 0 ? 30 : 0));
        const peopleScore = headcount > 0 ? 75 : 0; // Simplified
        const sgeScore = Math.round((financialScore * 0.3 + peopleScore * 0.2 + overallProcessScore * 0.3 + (activeItems > 0 ? 70 : 0) * 0.2));

        let sgeStatus = 'Empresa Saudável';
        if (sgeScore < 50) sgeStatus = 'Empresa em Risco';
        else if (sgeScore < 70) sgeStatus = 'Empresa em Transição';

        res.json({
            sgeScore,
            sgeStatus,
            financial: {
                revenue,
                costs,
                margin,
                cashAvailable,
                operatingMonths: costs > 0 ? Math.floor(cashAvailable / costs) : 0,
            },
            people: {
                headcount,
                turnover: 5.2, // Would need historical calculation
                climateScore: 4.2,
            },
            pipeline: {
                value: pipelineValue,
                activeItems,
            },
            processMaturity: {
                score: overallProcessScore,
                status: overallProcessScore >= 70 ? 'Saudável' : overallProcessScore >= 40 ? 'Transição' : 'Risco',
            },
            alerts,
            flows: flows.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                activeItems: f.items.length,
                totalValue: f.items.reduce((s, i) => s + (i.value || 0), 0),
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar dashboard' });
    }
});

export default router;
