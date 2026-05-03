// Institutions routes — full CRUD for system_admin.
// GET    /api/v1/institutions              — list all (system_admin) or active (others)
// POST   /api/v1/institutions              — create (system_admin)
// PATCH  /api/v1/institutions/:id          — update name/type/description/is_active (system_admin)
// GET    /api/v1/institutions/:id/staff    — list staff of an institution

import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── GET / — List institutions ─────────────────────────────────

router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const excludeOwn = req.query.exclude_own === 'true';

      let query = supabase
        .from('institutions')
        .select('id, name, type, description, is_active, created_at')
        .order('name');

      // non-admins only see active institutions
      if (user.role !== 'system_admin') {
        query = query.eq('is_active', true);
      }

      // exclude caller's own institution (used by referral modal)
      if (excludeOwn && user.institution_id) {
        query = query.neq('id', user.institution_id);
      }

      const { data: institutions, error } = await query;

      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch institutions' } });
        return;
      }

      res.status(200).json({ success: true, data: institutions ?? [] });
    } catch (err) {
      console.error('[institutions] GET /:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── POST / — Create institution (system_admin only) ────────────

router.post(
  '/',
  authenticate,
  requireRole('system_admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['mowsa', 'ewla', 'medical', 'shelter', 'ngo']).withMessage('Invalid institution type'),
    body('description').optional().trim(),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
        return;
      }

      const { name, type, description } = req.body;

      const { data: institution, error } = await supabase
        .from('institutions')
        .insert({ name, type, description: description || null, is_active: false })
        .select('id, name, type, description, is_active, created_at')
        .single();

      if (error) {
        res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create institution' } });
        return;
      }

      res.status(201).json({ success: true, data: institution });
    } catch (err) {
      console.error('[institutions] POST /:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── PATCH /:id — Update institution (system_admin only) ────────

router.patch(
  '/:id',
  authenticate,
  requireRole('system_admin'),
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid institution ID' } });
        return;
      }

      const { id } = req.params;
      const { name, type, description, is_active } = req.body;

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (type !== undefined) updates.type = type;
      if (description !== undefined) updates.description = description;
      if (is_active !== undefined) updates.is_active = is_active;

      const { data: institution, error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', id)
        .select('id, name, type, description, is_active, created_at')
        .single();

      if (error) {
        res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update institution' } });
        return;
      }

      res.status(200).json({ success: true, data: institution });
    } catch (err) {
      console.error('[institutions] PATCH /:id:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── GET /:id/staff — Staff of an institution ────────────────────

router.get(
  '/:id/staff',
  authenticate,
  requireRole('system_admin'),
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { data: staff, error } = await supabase
        .from('users')
        .select('id, display_name, role, is_active, created_at')
        .eq('institution_id', id)
        .order('display_name');

      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch staff' } });
        return;
      }

      res.status(200).json({ success: true, data: staff ?? [] });
    } catch (err) {
      console.error('[institutions] GET /:id/staff:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

export default router;
