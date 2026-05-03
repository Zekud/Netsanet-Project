// Notification routes — each user's personal notification feed.
// GET   /api/v1/notifications             — paginated list (unread first)
// PATCH /api/v1/notifications/read-all    — mark all as read
// PATCH /api/v1/notifications/:id/read    — mark single as read

import { Router, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── GET /notifications — Paginated notification feed ──────────
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { data: notifications, error, count } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, case_id, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('is_read', { ascending: true })      // unread first
        .order('created_at', { ascending: false })   // then newest
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch notifications' },
        });
        return;
      }

      const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

      res.status(200).json({
        success: true,
        data: notifications,
        unread_count: unreadCount,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
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

// ─── PATCH /notifications/read-all — Mark all as read ──────────
// Note: this route must be defined BEFORE /:id/read to avoid conflict.
router.patch(
  '/read-all',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── PATCH /notifications/:id/read — Mark single as read ───────
router.patch(
  '/:id/read',
  authenticate,
  [param('id').isUUID().withMessage('Invalid notification ID')],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid notification ID' },
        });
        return;
      }

      const { id } = req.params;
      const user = req.user!;

      // Only allow marking your own notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Failed to mark notification as read' },
        });
        return;
      }

      res.status(200).json({ success: true });
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
