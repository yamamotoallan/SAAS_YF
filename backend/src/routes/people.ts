import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, checkRole } from '../middleware/auth';
import { logActivity } from '../lib/log';
import { RulesService } from '../services/rules';

const router = Router();

// GET /api/people
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { department, status } = req.query;
        const where: any = { companyId: req.companyId };
        if (department && department !== 'all') where.department = department;
        if (status && status !== 'all') where.status = status;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [people, total] = await Promise.all([
            prisma.person.findMany({
                where,
                orderBy: { name: 'asc' },
                skip,
                take: limit
            }),
            prisma.person.count({ where })
        ]);

        res.json({
            data: people,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
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

        const departments: Record<string, { count: number; people: any[] }> = {};
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

        // Fetch Climate Scores from KPIs
        const kpis = await prisma.kPI.findMany({ where: { companyId: req.companyId } });

        const climateKpiValues = {
            'Liderança': kpis.find(k => k.name.includes('Liderança'))?.value || 85,
            'Ambiente': kpis.find(k => k.name.includes('Ambiente'))?.value || 80,
            'Salário/Benefícios': kpis.find(k => k.name.includes('Salário') || k.name.includes('Benefícios'))?.value || 70,
            'Comunicação': kpis.find(k => k.name.includes('Comunicação'))?.value || 75
        };

        const climateKpi = kpis.find(k => k.name.includes('Satisfação') || k.name.includes('Clima') || k.name.includes('eNPS'));
        let enps = climateKpi ? (climateKpi.unit === 'score' ? climateKpi.value : (climateKpi.value / 100) * 100) : 75; // Logic for eNPS scale (-100 to 100 or 0-100)

        const climateBreakdown = Object.entries(climateKpiValues).map(([label, val]) => ({
            label,
            val,
            color: val < 50 ? 'var(--color-danger)' : val < 75 ? 'var(--color-warning)' : 'var(--color-success)'
        }));

        res.json({
            headcount,
            turnover,
            recentHires,
            enps: Math.round(enps),
            climateBreakdown,
            teams
        });
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
        const before = await prisma.person.findFirst({ where: { id: req.params.id as string, companyId: req.companyId } });
        if (!before) { res.status(404).json({ error: 'Colaborador não encontrado' }); return; }

        await prisma.person.update({
            where: { id: req.params.id as string },
            data: {
                name: req.body.name, role: req.body.role, department: req.body.department,
                salary: req.body.salary !== undefined ? parseFloat(req.body.salary) : undefined,
                status: req.body.status,
            },
        });

        const updated = await prisma.person.findUnique({ where: { id: req.params.id as string } });
        logActivity({ action: 'updated', module: 'people', entityId: req.params.id as string, entityName: before.name, details: { changes: req.body }, companyId: req.companyId!, userId: req.userId });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar colaborador' });
    }
});

// DELETE /api/people/:id
router.delete('/:id', checkRole(['admin', 'manager']), async (req: AuthRequest, res) => {
    try {
        const person = await prisma.person.findFirst({ where: { id: req.params.id as string, companyId: req.companyId } });
        await prisma.person.deleteMany({ where: { id: req.params.id as string, companyId: req.companyId } });

        logActivity({ action: 'deleted', module: 'people', entityId: req.params.id as string, entityName: person?.name || req.params.id as string, companyId: req.companyId!, userId: req.userId });

        // Trigger Turnover Rule Check
        const allPeople = await prisma.person.findMany({ where: { companyId: req.companyId } });
        const activePeopleCount = allPeople.filter(p => p.status === 'active').length;
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const inactive = allPeople.filter(p => p.status === 'inactive');
        const recentInactive = inactive.filter(p => p.updatedAt >= threeMonthsAgo);
        const turnover = activePeopleCount > 0 ? Math.round((recentInactive.length / activePeopleCount) * 1000) / 10 : 0;

        await RulesService.evaluate({
            companyId: req.companyId!,
            entity: 'people',
            data: { turnover }
        });

        res.json({ message: 'Colaborador removido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover colaborador' });
    }
});

export default router;
