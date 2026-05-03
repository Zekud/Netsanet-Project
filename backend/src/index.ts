// Express application entry point — Netsanet backend API.
// All routes are prefixed with /api/v1.

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import casesRoutes from './routes/cases';
import usersRoutes from './routes/users';
import referralsRoutes from './routes/referrals';
import institutionsRoutes from './routes/institutions';
import messagesRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications';
import aiRoutes from './routes/ai';
import evidenceRoutes from './routes/evidence';
import staffRoutes from './routes/staff';
import analyticsRoutes from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Global Middleware ────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'netsanet-backend',
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── Routes ───────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cases', casesRoutes);
app.use('/api/v1/cases/:id/messages', messagesRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1', referralsRoutes);
app.use('/api/v1/institutions', institutionsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/cases/:id/evidence', evidenceRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// ─── 404 Handler ──────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API endpoint does not exist',
    },
  });
});

// ─── Global Error Handler ─────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// ─── Start Server ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🟢 Netsanet backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/v1/health\n`);
});

export default app;
