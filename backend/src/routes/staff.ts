// Staff management routes — institution_admin manages their own staff.
// GET   /api/v1/staff        — list staff in my institution
// POST  /api/v1/staff        — create a new staff account (sends OTP)
// PATCH /api/v1/staff/:id    — update role or deactivate

import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── GET /staff — List staff in my institution ────────────────

router.get(
  '/',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const institutionId = user.role === 'system_admin'
        ? (req.query.institution_id as string | undefined)
        : user.institution_id;

      if (!institutionId) {
        res.status(400).json({ success: false, error: { code: 'MISSING_INSTITUTION', message: 'No institution context' } });
        return;
      }

      // Join cases count for each worker
      const { data: staff, error } = await supabase
        .from('users')
        .select('id, display_name, role, phone, is_active, created_at')
        .eq('institution_id', institutionId)
        .in('role', ['case_worker', 'institution_admin'])
        .order('display_name');

      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch staff' } });
        return;
      }

      // Get assigned case counts per worker
      const { data: caseCounts } = await supabase
        .from('cases')
        .select('assigned_worker_id')
        .eq('holding_institution_id', institutionId)
        .not('assigned_worker_id', 'is', null);

      const countMap: Record<string, number> = {};
      for (const c of caseCounts ?? []) {
        if (c.assigned_worker_id) {
          countMap[c.assigned_worker_id] = (countMap[c.assigned_worker_id] || 0) + 1;
        }
      }

      const enriched = (staff ?? []).map((s) => ({
        ...s,
        cases_assigned: countMap[s.id] ?? 0,
      }));

      res.status(200).json({ success: true, data: enriched });
    } catch (err) {
      console.error('[staff] GET /:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── POST /staff — Create staff account ──────────────────────

router.post(
  '/',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  [
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phone').optional().isString().withMessage('Invalid phone'),
    body('display_name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['case_worker', 'institution_admin']).withMessage('Invalid role'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[staff] POST validation errors:', JSON.stringify(errors.array()));
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
        return;
      }

      const user = req.user!;
      const { email, phone, display_name, role, institution_id: bodyInstitutionId } = req.body;
      console.log('[staff] POST body:', { email, phone: phone ? '***' : undefined, display_name, role });
      console.log('[staff] POST user institution_id:', user.institution_id, 'role:', user.role);

      if (!email && !phone) {
        console.log('[staff] POST → missing contact info');
        res.status(400).json({ success: false, error: { code: 'MISSING_CONTACT', message: 'Email or phone is required' } });
        return;
      }

      // system_admin passes institution_id in the body; institution_admin uses their own
      const institutionId = user.role === 'system_admin'
        ? bodyInstitutionId
        : user.institution_id;

      if (!institutionId) {
        console.log('[staff] POST → no institution_id');
        res.status(400).json({ success: false, error: { code: 'NO_INSTITUTION', message: 'institution_id is required' } });
        return;
      }

      // Create auth user via Supabase Admin — this sends an OTP/magic link
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email || undefined,
        phone: phone || undefined,
        email_confirm: !!email,
        phone_confirm: !!phone,
        user_metadata: { display_name },
      });

      if (authError || !authData.user) {
        console.error('[staff] Auth create error:', authError?.message);
        res.status(500).json({ success: false, error: { code: 'AUTH_CREATE_FAILED', message: authError?.message || 'Failed to create user' } });
        return;
      }

      // Insert into users table
      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          role,
          institution_id: institutionId,
          display_name,
          phone: phone || null,
          is_active: true,
        })
        .select('id, display_name, role, phone, is_active, created_at')
        .single();

      if (dbError) {
        console.error('[staff] DB insert error:', dbError.message);
        // Cleanup orphaned auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        res.status(500).json({ success: false, error: { code: 'DB_INSERT_FAILED', message: 'Failed to save staff record' } });
        return;
      }

      res.status(201).json({ success: true, data: { ...newUser, cases_assigned: 0 } });
    } catch (err) {
      console.error('[staff] POST /:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── PATCH /staff/:id — Update role or deactivate ────────────

router.patch(
  '/:id',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid staff ID' } });
        return;
      }

      const { id } = req.params;
      const user = req.user!;
      const { role, is_active } = req.body;

      // Ensure the target staff belongs to same institution (unless system_admin)
      if (user.role !== 'system_admin') {
        const { data: target } = await supabase
          .from('users')
          .select('institution_id')
          .eq('id', id)
          .single();

        if (!target || target.institution_id !== user.institution_id) {
          res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Cannot modify staff outside your institution' } });
          return;
        }
      }

      const updates: Record<string, unknown> = {};
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.is_active = is_active;

      const { data: updated, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, display_name, role, is_active')
        .single();

      if (error) {
        res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update staff' } });
        return;
      }

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error('[staff] PATCH /:id:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

export default router;
