import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email e senha são obrigatórios' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
        });

        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, companyId: user.companyId },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no login' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, companyName, industry, revenue, headcount } = req.body;

        if (!email || !password || !name || !companyName) {
            res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ error: 'Email já cadastrado' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const company = await prisma.company.create({
            data: {
                name: companyName,
                segment: industry || null,
                revenue: revenue ? parseFloat(revenue) : null,
                headcount: headcount ? parseInt(headcount) : null,
            },
        });

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'admin',
                companyId: company.id,
            },
        });

        const token = jwt.sign(
            { id: user.id, companyId: company.id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no registro' });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) { res.status(401).json({ error: 'Token não fornecido' }); return; }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { company: true },
        });

        if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company,
        });
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
});

export default router;
