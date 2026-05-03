// Analytics routes — KPIs and breakdowns for institution_admin and system_admin.
// GET /api/v1/analytics/overview     — KPI summary
// GET /api/v1/analytics/by-status    — case count by status
// GET /api/v1/analytics/by-category  — case count by category
// GET /api/v1/analytics/trend        — cases per day (period=7d|30d|90d)

import { Router, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── Scope helper ─────────────────────────────────────────────
// Returns a filter object to scope queries by institution if not system_admin.

function getScope(user: NonNullable<AuthenticatedRequest['user']>) {
  if (user.role === 'system_admin') return null;
  return user.institution_id;
}

// ─── GET /overview — KPI Summary ──────────────────────────────

router.get(
  '/overview',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const institutionId = getScope(req.user!);

      let q = supabase.from('cases').select('id, status, urgency_level, created_at, updated_at');
      if (institutionId) q = q.eq('holding_institution_id', institutionId);

      const { data: cases, error } = await q;
      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch analytics' } });
        return;
      }

      const all = cases ?? [];
      const totalCases = all.length;
      const openCases = all.filter((c) => !['resolved', 'closed'].includes(c.status)).length;
      const criticalCases = all.filter((c) => c.urgency_level === 'critical').length;

      // Avg resolution days — only for resolved/closed cases
      const resolved = all.filter((c) => ['resolved', 'closed'].includes(c.status));
      let avgResolutionDays = 0;
      if (resolved.length > 0) {
        const totalMs = resolved.reduce((acc, c) => {
          return acc + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime());
        }, 0);
        avgResolutionDays = Math.round(totalMs / resolved.length / 86400000);
      }

      res.status(200).json({
        success: true,
        data: { totalCases, openCases, criticalCases, avgResolutionDays },
      });
    } catch (err) {
      console.error('[analytics] GET /overview:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── GET /by-status — Breakdown by status ─────────────────────

router.get(
  '/by-status',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const institutionId = getScope(req.user!);

      let q = supabase.from('cases').select('status');
      if (institutionId) q = q.eq('holding_institution_id', institutionId);

      const { data: cases, error } = await q;
      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch analytics' } });
        return;
      }

      const counts: Record<string, number> = {};
      for (const c of cases ?? []) {
        counts[c.status] = (counts[c.status] || 0) + 1;
      }

      const data = Object.entries(counts).map(([status, count]) => ({ status, count }));
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[analytics] GET /by-status:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── GET /by-category — Breakdown by category ─────────────────

router.get(
  '/by-category',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const institutionId = getScope(req.user!);

      let q = supabase.from('cases').select('category');
      if (institutionId) q = q.eq('holding_institution_id', institutionId);

      const { data: cases, error } = await q;
      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch analytics' } });
        return;
      }

      const counts: Record<string, number> = {};
      for (const c of cases ?? []) {
        const cat = c.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
      }

      const data = Object.entries(counts).map(([category, count]) => ({ category, count }));
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[analytics] GET /by-category:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── GET /trend — Cases per day ───────────────────────────────

router.get(
  '/trend',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  [query('period').optional().isIn(['7d', '30d', '90d'])],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'period must be 7d, 30d, or 90d' } });
        return;
      }

      const period = (req.query.period as string) || '30d';
      const days = parseInt(period.replace('d', ''), 10);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const institutionId = getScope(req.user!);

      let q = supabase.from('cases').select('created_at').gte('created_at', since);
      if (institutionId) q = q.eq('holding_institution_id', institutionId);

      const { data: cases, error } = await q;
      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch trend data' } });
        return;
      }

      // Group by date string (YYYY-MM-DD)
      const byDay: Record<string, number> = {};

      // Pre-fill all days with 0 so the chart has no gaps
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        byDay[key] = 0;
      }

      for (const c of cases ?? []) {
        const key = c.created_at.slice(0, 10);
        if (byDay[key] !== undefined) byDay[key]++;
      }

      const data = Object.entries(byDay).map(([date, count]) => ({ date, count }));
      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[analytics] GET /trend:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

export default router;
