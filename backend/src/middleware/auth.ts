import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string;
    companyId?: string;
    userRole?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Token não fornecido' });
        return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        res.status(401).json({ error: 'Token inválido' });
        return;
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        res.status(401).json({ error: 'Token mal formatado' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
            id: string;
            companyId: string;
            role: string;
        };

        req.userId = decoded.id;
        req.companyId = decoded.companyId;
        req.userRole = decoded.role;

        return next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado' });
        return;
    }
};

export const checkRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.userRole) {
            res.status(403).json({ error: 'Acesso negado: Perfil não identificado' });
            return;
        }

        if (!allowedRoles.includes(req.userRole)) {
            res.status(403).json({ error: 'Acesso negado: Sem permissão suficiente' });
            return;
        }

        next();
    };
};
