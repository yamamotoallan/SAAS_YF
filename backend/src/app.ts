import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import flowRoutes from './routes/flows';
import itemRoutes from './routes/items';
import processRoutes from './routes/processes';
import kpiRoutes from './routes/kpis';
import financialRoutes from './routes/financial';
import peopleRoutes from './routes/people';
import alertRoutes from './routes/alerts';
import companyRoutes from './routes/company';
import dashboardRoutes from './routes/dashboard';
import operationsRoutes from './routes/operations';
import logRoutes from './routes/logs';
import goalRoutes from './routes/goals';
import ruleRoutes from './routes/rules';
import ceoMindRoutes from './routes/ceoMind';

const app = express();

// Always-allowed origins (hard-coded safe defaults)
const DEFAULT_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://saas-yf.vercel.app',   // Production Vercel URL
];

// Merge env-var origins if set (comma-separated)
const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean)
    : [];

const allowedOrigins = [...new Set([...DEFAULT_ORIGINS, ...envOrigins])];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.warn(`CORS: blocked origin → ${origin}`);
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));

app.use(express.json());

// Basic rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente mais tarde.' }
});

// Stricter limiter for auth (brute force protection)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Limit each IP to 10 requests per hour for login/register
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Tente novamente em uma hora.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/flows', authMiddleware, flowRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/process-blocks', authMiddleware, processRoutes);
app.use('/api/kpis', authMiddleware, kpiRoutes);
app.use('/api/financial', authMiddleware, financialRoutes);
app.use('/api/people', authMiddleware, peopleRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/company', authMiddleware, companyRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/operations', authMiddleware, operationsRoutes);
app.use('/api/logs', authMiddleware, logRoutes);
app.use('/api/goals', authMiddleware, goalRoutes);
app.use('/api/rules', authMiddleware, ruleRoutes);
app.use('/api/ceo-mind', authMiddleware, ceoMindRoutes);

// Error handler
app.use(errorHandler);

export default app;
