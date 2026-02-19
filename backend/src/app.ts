import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

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

const app = express();

// Allow multiple origins (comma-separated in FRONTEND_URL env var)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));

app.use(express.json());

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

// Error handler
app.use(errorHandler);

export default app;
