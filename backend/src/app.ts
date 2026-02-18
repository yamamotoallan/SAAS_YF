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

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Error handler
app.use(errorHandler);

export default app;
