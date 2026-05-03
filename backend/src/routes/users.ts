// User routes — staff-facing user lookups.
// GET /api/v1/users/workers — list case workers in the same institution.

import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── GET /users/workers — List case workers for assignment dropdown ─
router.get(
  '/workers',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      let query = supabase
        .from('users')
        .select('id, display_name, role, institution_id')
        .eq('role', 'case_worker')
        .eq('is_active', true);

      // Institution admins only see workers in their own institution
      if (user.role === 'institution_admin' && user.institution_id) {
        query = query.eq('institution_id', user.institution_id);
      }

      const { data: workers, error } = await query.order('display_name');

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch workers' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: workers,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

export default router;
