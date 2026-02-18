import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 YF Consultoria API rodando na porta ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
