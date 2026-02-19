// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../lib/log';

const router = Router();

// GET /api/people
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { department, status } = req.query;
        const where: any = { companyId: req.companyId };
        if (department && department !== 'all') where.department = department;
        if (status && status !== 'all') where.status = status;

        const people = await prisma.person.findMany({ where, orderBy: { name: 'asc' } });
        res.json(people);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar colaboradores' });
    }
});

// GET /api/people/summary
router.get('/summary', async (req: AuthRequest, res) => {
    try {
        const people = await prisma.person.findMany({ where: { companyId: req.companyId } });
        const active = people.filter(p => p.status === 'active');
        const headcount = active.length;

        const departments: Record<string, { count: number; people: typeof active }> = {};
        active.forEach(p => {
            if (!departments[p.department]) departments[p.department] = { count: 0, people: [] };
            departments[p.department].count++;
            departments[p.department].people.push(p);
        });

        const teams = Object.entries(departments).map(([name, data]) => ({
            name, size: data.count, lead: data.people[0]?.name || 'N/A',
            status: data.count > 3 ? 'healthy' : 'attention',
        }));

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const inactive = people.filter(p => p.status === 'inactive');
        const recentInactive = inactive.filter(p => p.updatedAt >= threeMonthsAgo);
        const turnover = headcount > 0 ? Math.round((recentInactive.length / headcount) * 1000) / 10 : 0;

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const recentHires = active.filter(p => p.hireDate >= oneMonthAgo).length;

        // Fetch Climate Score from KPIs
        const kpis = await prisma.kPI.findMany({ where: { companyId: req.companyId } });
        const climateKpi = kpis.find(k => k.name.includes('Satisfação') || k.name.includes('Clima') || k.name.includes('eNPS'));
        const climateScore = climateKpi ? (climateKpi.unit === 'score' ? climateKpi.value / 20 : climateKpi.value) : 0;

        res.json({ headcount, turnover, recentHires, climateScore: climateScore || 4.2, teams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar resumo de pessoas' });
    }
});

// POST /api/people
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { name, role, department, hireDate, salary, status } = req.body;
        if (!name || !role || !department) {
            res.status(400).json({ error: 'Nome, cargo e departamento são obrigatórios' });
            return;
        }

        const person = await prisma.person.create({
            data: {
                name, role, department,
                hireDate: new Date(hireDate || Date.now()),
                salary: salary ? parseFloat(salary) : null,
                status: status || 'active',
                companyId: req.companyId!,
            },
        });

        logActivity({ action: 'created', module: 'people', entityId: person.id, entityName: `${name} - ${role}`, details: { department }, companyId: req.companyId!, userId: req.userId });
        res.status(201).json(person);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar colaborador' });
    }
});

// PUT /api/people/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const before = await prisma.person.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        if (!before) { res.status(404).json({ error: 'Colaborador não encontrado' }); return; }

        await prisma.person.update({
            where: { id: req.params.id },
            data: {
                name: req.body.name, role: req.body.role, department: req.body.department,
                salary: req.body.salary !== undefined ? parseFloat(req.body.salary) : undefined,
                status: req.body.status,
            },
        });

        const updated = await prisma.person.findUnique({ where: { id: req.params.id } });
        logActivity({ action: 'updated', module: 'people', entityId: req.params.id, entityName: before.name, details: { changes: req.body }, companyId: req.companyId!, userId: req.userId });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar colaborador' });
    }
});

// DELETE /api/people/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const person = await prisma.person.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
        await prisma.person.deleteMany({ where: { id: req.params.id, companyId: req.companyId } });

        logActivity({ action: 'deleted', module: 'people', entityId: req.params.id, entityName: person?.name || req.params.id, companyId: req.companyId!, userId: req.userId });
        res.json({ message: 'Colaborador removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover colaborador' });
    }
});

export default router;
