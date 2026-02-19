// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/company
router.get('/', async (req: AuthRequest, res) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.companyId },
        });

        if (!company) { res.status(404).json({ error: 'Empresa não encontrada' }); return; }
        res.json(company);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
});

// PUT /api/company
router.put('/', async (req: AuthRequest, res) => {
    try {
        const company = await prisma.company.update({
            where: { id: req.companyId },
            data: {
                name: req.body.name,
                cnpj: req.body.cnpj,
                segment: req.body.segment,
                size: req.body.size,
                revenue: req.body.revenue !== undefined ? parseFloat(req.body.revenue) : undefined,
                headcount: req.body.headcount !== undefined ? parseInt(req.body.headcount) : undefined,
                financialTargets: req.body.financialTargets ? req.body.financialTargets : undefined,
                settings: req.body.settings ? req.body.settings : undefined,
            },
        });

        res.json(company);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
});

// GET /api/company/users
router.get('/users', async (req: AuthRequest, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { companyId: req.companyId },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { name: 'asc' },
        });

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

export default router;
