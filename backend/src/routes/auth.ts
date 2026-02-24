import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

import { MailService } from '../services/mailService';

const router = Router();



// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email é obrigatório' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Safety: Do not reveal if email exists or not
        if (user) {
            const token = jwt.sign(
                { id: user.id, reset: true },
                process.env.JWT_SECRET!,
                { expiresIn: '15m' }
            );

            await MailService.sendPasswordReset(email, token);
        }

        res.json({ message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; reset: boolean };

        if (!decoded.reset) {
            res.status(400).json({ error: 'Token inválido para recuperação de senha' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Link expirado ou inválido' });
    }
});

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
            { id: user.id, companyId: user.companyId, role: user.role },
            process.env.JWT_SECRET!,
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
        const publicRegistrationEnabled = process.env.ALLOW_PUBLIC_REGISTRATION === 'true';

        if (!publicRegistrationEnabled) {
            res.status(403).json({ error: 'O registro público está desativado. Entre em contato com o suporte.' });
            return;
        }

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
            { id: user.id, companyId: company.id, role: user.role },
            process.env.JWT_SECRET!,
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
router.get('/me', async (req: AuthRequest, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) { res.status(401).json({ error: 'Token não fornecido' }); return; }

        const token = authHeader.split(' ')[1];
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET not configured');
            res.status(500).json({ error: 'Erro de configuração' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

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
