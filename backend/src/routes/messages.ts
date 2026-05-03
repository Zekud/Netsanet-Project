// Message routes — case-scoped chat between survivor and case worker.
// GET  /api/v1/cases/:id/messages       — fetch message history
// POST /api/v1/cases/:id/messages       — send a message
// POST /api/v1/cases/:id/messages/read  — mark all messages as read

import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router({ mergeParams: true });

// ─── Helper: check case access for messaging ───────────────────
async function canAccessCaseMessages(
  caseId: string,
  user: { id: string; role: string; institution_id?: string | null }
): Promise<{ allowed: boolean; caseData?: Record<string, unknown> }> {
  const { data: caseData, error } = await supabase
    .from('cases')
    .select('id, survivor_id, assigned_worker_id, holding_institution_id')
    .eq('id', caseId)
    .single();

  if (error || !caseData) return { allowed: false };

  if (user.role === 'survivor') {
    return { allowed: caseData.survivor_id === user.id, caseData };
  }
  if (user.role === 'case_worker') {
    return { allowed: caseData.assigned_worker_id === user.id, caseData };
  }
  if (user.role === 'institution_admin') {
    return { allowed: caseData.holding_institution_id === user.institution_id, caseData };
  }
  if (user.role === 'system_admin') {
    return { allowed: true, caseData };
  }

  return { allowed: false };
}

// ─── GET /cases/:id/messages — Fetch message history ───────────
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const caseId = req.params.id;
      const user = req.user!;

      const { allowed } = await canAccessCaseMessages(caseId, user);
      if (!allowed) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You do not have access to this case' },
        });
        return;
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, is_read, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch messages' },
        });
        return;
      }

      // Enrich with sender info (role + display_name for bubble styling)
      const senderIds = [...new Set((messages || []).map((m) => m.sender_id))];
      let senderMap: Record<string, { display_name: string | null; role: string }> = {};

      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from('users')
          .select('id, display_name, role')
          .in('id', senderIds);

        if (senders) {
          senderMap = Object.fromEntries(
            senders.map((s) => [s.id, { display_name: s.display_name, role: s.role }])
          );
        }
      }

      const ROLE_LABELS: Record<string, string> = {
        survivor: 'Survivor',
        case_worker: 'Case Worker',
        institution_admin: 'Institution Admin',
        system_admin: 'System Admin',
      };

      const enriched = (messages || []).map((m) => ({
        ...m,
        sender_name: senderMap[m.sender_id]?.display_name
          || ROLE_LABELS[senderMap[m.sender_id]?.role] 
          || 'Staff',
        sender_role: senderMap[m.sender_id]?.role || 'unknown',
      }));

      res.status(200).json({ success: true, data: enriched });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── POST /cases/:id/messages — Send a message ─────────────────
router.post(
  '/',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid case ID'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message content is required (max 5000 characters)'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: errors.mapped() },
        });
        return;
      }

      const caseId = req.params.id;
      const { content } = req.body;
      const user = req.user!;

      const { allowed, caseData } = await canAccessCaseMessages(caseId, user);
      if (!allowed) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You do not have access to this case' },
        });
        return;
      }

      // Step 1: Insert message — Supabase Realtime broadcasts automatically
      const { data: message, error: insertError } = await supabase
        .from('messages')
        .insert({
          case_id: caseId,
          sender_id: user.id,
          content,
          is_read: false,
        })
        .select()
        .single();

      if (insertError || !message) {
        console.error(insertError);
        res.status(500).json({
          success: false,
          error: { code: 'INSERT_FAILED', message: 'Failed to send message' },
        });
        return;
      }

      // Step 2: Notify the OTHER party (only if they have no unread messages already)
      if (caseData) {
        const cd = caseData as {
          survivor_id: string;
          assigned_worker_id: string | null;
          case_number?: string;
        };

        let notifyUserId: string | null = null;

        if (user.role === 'survivor' && cd.assigned_worker_id) {
          // Survivor sent → notify the assigned worker
          notifyUserId = cd.assigned_worker_id;
        } else if (
          (user.role === 'case_worker' || user.role === 'institution_admin') &&
          cd.survivor_id
        ) {
          // Staff sent → notify the survivor
          notifyUserId = cd.survivor_id;
        }

        if (notifyUserId) {
          // Only notify if the recipient doesn't already have unread messages
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('case_id', caseId)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          if ((count ?? 0) <= 1) {
            await supabase.from('notifications').insert({
              user_id: notifyUserId,
              type: 'new_message' as const,
              title: 'New message on your case',
              body: content.length > 80 ? content.slice(0, 80) + '…' : content,
              case_id: caseId,
            });
          }
        }
      }

      const ROLE_LABELS2: Record<string, string> = {
        survivor: 'Survivor',
        case_worker: 'Case Worker',
        institution_admin: 'Institution Admin',
        system_admin: 'System Admin',
      };
      const senderProfile = (await supabase
        .from('users')
        .select('display_name, role')
        .eq('id', user.id)
        .single()).data;

      res.status(201).json({
        success: true,
        data: {
          ...message,
          sender_name: senderProfile?.display_name
            || ROLE_LABELS2[user.role]
            || 'Staff',
          sender_role: user.role,
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

// ─── POST /cases/:id/messages/read — Mark all as read ──────────
router.post(
  '/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const caseId = req.params.id;
      const user = req.user!;

      const { allowed } = await canAccessCaseMessages(caseId, user);
      if (!allowed) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You do not have access to this case' },
        });
        return;
      }

      // Mark all messages NOT sent by the current user as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('case_id', caseId)
        .neq('sender_id', user.id)
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

export default router;
