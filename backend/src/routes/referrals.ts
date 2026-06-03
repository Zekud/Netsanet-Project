// Referral routes — handles case referrals between institutions.
// POST   /cases/:id/referrals       — create referral (case_worker / institution_admin)
// GET    /referrals/incoming        — referrals sent TO my institution
// GET    /referrals/outgoing        — referrals sent FROM my institution
// PATCH  /referrals/:id/accept      — accept referral
// PATCH  /referrals/:id/reject      — reject referral

import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types';

const router = Router({ mergeParams: true });

// ─── POST /cases/:id/referrals — Send a referral ──────────────
router.post(
  '/cases/:id/referrals',
  authenticate,
  requireRole('case_worker', 'institution_admin'),
  [
    param('id').isString().notEmpty().withMessage('Invalid case ID'),
    body('to_institution_id').isString().notEmpty().withMessage('Target institution ID is required'),
    body('note').optional().isString().trim().isLength({ max: 1000 }),
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
      const { to_institution_id, note } = req.body;
      const user = req.user!;

      // Fetch the case
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id, case_number, status, holding_institution_id, survivor_id')
        .eq('id', caseId)
        .single();

      if (caseError || !caseData) {
        res.status(404).json({
          success: false,
          error: { code: 'CASE_NOT_FOUND', message: 'Case not found' },
        });
        return;
      }

      // Step 1: Validate — only the holding institution can refer
      if (caseData.holding_institution_id !== user.institution_id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only refer cases held by your institution',
          },
        });
        return;
      }

      // Can't refer to your own institution
      if (to_institution_id === user.institution_id) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_REFERRAL', message: 'Cannot refer a case to your own institution' },
        });
        return;
      }

      // Verify the target institution exists and is active
      const { data: targetInstitution, error: instError } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('id', to_institution_id)
        .eq('is_active', true)
        .single();

      if (instError || !targetInstitution) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INSTITUTION', message: 'Target institution not found or inactive' },
        });
        return;
      }

      // Step 2: Insert referrals row
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .insert({
          case_id: caseId,
          from_institution_id: user.institution_id,
          to_institution_id,
          referred_by: user.id,
          status: 'pending',
          note: note || null,
        })
        .select()
        .single();

      if (referralError || !referral) {
        console.error(referralError);
        res.status(500).json({
          success: false,
          error: { code: 'REFERRAL_FAILED', message: 'Failed to create referral' },
        });
        return;
      }

      // Step 3: Update case status to 'referred'
      await supabase
        .from('cases')
        .update({ status: 'referred', updated_at: new Date().toISOString() })
        .eq('id', caseId);

      // Step 4: Log activity
      await supabase.from('case_activities').insert({
        case_id: caseId,
        actor_id: user.id,
        activity_type: 'referral_created',
        description: `Case referred to ${targetInstitution.name}`,
        metadata: {
          referral_id: referral.id,
          to_institution_id,
          to_institution_name: targetInstitution.name,
        },
      });

      // Step 5: Notify target institution's admins
      const { data: targetAdmins } = await supabase
        .from('users')
        .select('id')
        .eq('institution_id', to_institution_id)
        .eq('role', 'institution_admin')
        .eq('is_active', true);

      if (targetAdmins && targetAdmins.length > 0) {
        await supabase.from('notifications').insert(
          targetAdmins.map((admin) => ({
            user_id: admin.id,
            type: 'referral_received' as const,
            title: 'New referral received',
            body: `You have received a referral for case #${caseData.case_number}. Please review and respond.`,
            case_id: caseId,
          }))
        );
      }

      res.status(201).json({
        success: true,
        data: referral,
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

// ─── GET /referrals/incoming — Referrals sent TO my institution ─
router.get(
  '/referrals/incoming',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      let query = supabase
        .from('referrals')
        .select('id, case_id, from_institution_id, to_institution_id, referred_by, status, note, response_note, responded_at, created_at, cases(case_number, title, urgency_level, category), institutions!referrals_from_institution_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (user.role === 'institution_admin' && user.institution_id) {
        query = query.eq('to_institution_id', user.institution_id);
      }

      const { data: referrals, error } = await query;

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch incoming referrals' },
        });
        return;
      }

      res.status(200).json({ success: true, data: referrals });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── GET /referrals/outgoing — Referrals sent FROM my institution ─
router.get(
  '/referrals/outgoing',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      let query = supabase
        .from('referrals')
        .select('id, case_id, from_institution_id, to_institution_id, referred_by, status, note, response_note, responded_at, created_at, cases(case_number, title, urgency_level, category), institutions!referrals_to_institution_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (user.role === 'institution_admin' && user.institution_id) {
        query = query.eq('from_institution_id', user.institution_id);
      }

      const { data: referrals, error } = await query;

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch outgoing referrals' },
        });
        return;
      }

      res.status(200).json({ success: true, data: referrals });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── PATCH /referrals/:id/accept — Accept a referral ──────────
router.patch(
  '/referrals/:id/accept',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  [
    param('id').isUUID().withMessage('Invalid referral ID'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Fetch the referral
      const { data: referral, error: refError } = await supabase
        .from('referrals')
        .select('id, case_id, from_institution_id, to_institution_id, status')
        .eq('id', id)
        .single();

      if (refError || !referral) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Referral not found' },
        });
        return;
      }

      // Only the target institution can accept
      if (referral.to_institution_id !== user.institution_id && user.role !== 'system_admin') {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'Only the target institution can accept this referral' },
        });
        return;
      }

      if (referral.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'This referral has already been responded to' },
        });
        return;
      }

      // Fetch the case
      const { data: caseData } = await supabase
        .from('cases')
        .select('id, case_number, survivor_id')
        .eq('id', referral.case_id)
        .single();

      // Fetch accepting institution name
      const { data: acceptingInst } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', referral.to_institution_id)
        .single();

      // Step 1: Update referral status
      await supabase
        .from('referrals')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', id);

      // Step 2: Update case — transfer ownership, clear worker assignment
      await supabase
        .from('cases')
        .update({
          holding_institution_id: referral.to_institution_id,
          assigned_worker_id: null,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.case_id);

      // Step 3: Log activity
      await supabase.from('case_activities').insert({
        case_id: referral.case_id,
        actor_id: user.id,
        activity_type: 'referral_accepted',
        description: `Referral accepted by ${acceptingInst?.name || 'institution'}`,
        metadata: { referral_id: id, accepted_by_institution: referral.to_institution_id },
      });

      // Step 4: Notify the referring institution's admins
      const { data: fromAdmins } = await supabase
        .from('users')
        .select('id')
        .eq('institution_id', referral.from_institution_id)
        .eq('role', 'institution_admin')
        .eq('is_active', true);

      if (fromAdmins && fromAdmins.length > 0) {
        await supabase.from('notifications').insert(
          fromAdmins.map((admin) => ({
            user_id: admin.id,
            type: 'referral_accepted' as const,
            title: 'Referral accepted',
            body: `Referral for case #${caseData?.case_number} was accepted by ${acceptingInst?.name || 'the receiving institution'}.`,
            case_id: referral.case_id,
          }))
        );
      }

      // Step 5: Notify the survivor
      if (caseData?.survivor_id) {
        await supabase.from('notifications').insert({
          user_id: caseData.survivor_id,
          type: 'case_update' as const,
          title: 'Your case has a new support team',
          body: 'Your case has been accepted by a specialized support team who will reach out to help you.',
          case_id: referral.case_id,
        });
      }

      res.status(200).json({ success: true, data: { id, status: 'accepted' } });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }
  }
);

// ─── PATCH /referrals/:id/reject — Reject a referral ──────────
router.patch(
  '/referrals/:id/reject',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  [
    param('id').isUUID().withMessage('Invalid referral ID'),
    body('response_note').optional().isString().trim().isLength({ max: 500 }),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { response_note } = req.body;
      const user = req.user!;

      const { data: referral, error: refError } = await supabase
        .from('referrals')
        .select('id, case_id, from_institution_id, to_institution_id, status')
        .eq('id', id)
        .single();

      if (refError || !referral) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Referral not found' },
        });
        return;
      }

      if (referral.to_institution_id !== user.institution_id && user.role !== 'system_admin') {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'Only the target institution can reject this referral' },
        });
        return;
      }

      if (referral.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'This referral has already been responded to' },
        });
        return;
      }

      const { data: caseData } = await supabase
        .from('cases')
        .select('id, case_number')
        .eq('id', referral.case_id)
        .single();

      // Step 1: Update referral
      await supabase
        .from('referrals')
        .update({
          status: 'rejected',
          response_note: response_note || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Step 2: Revert case status to under_review
      await supabase
        .from('cases')
        .update({ status: 'under_review', updated_at: new Date().toISOString() })
        .eq('id', referral.case_id);

      // Step 3: Log activity
      await supabase.from('case_activities').insert({
        case_id: referral.case_id,
        actor_id: user.id,
        activity_type: 'referral_rejected',
        description: `Referral rejected${response_note ? `: "${response_note}"` : ''}`,
        metadata: { referral_id: id, response_note },
      });

      // Step 4: Notify the referring institution's admins
      const { data: fromAdmins } = await supabase
        .from('users')
        .select('id')
        .eq('institution_id', referral.from_institution_id)
        .eq('role', 'institution_admin')
        .eq('is_active', true);

      if (fromAdmins && fromAdmins.length > 0) {
        await supabase.from('notifications').insert(
          fromAdmins.map((admin) => ({
            user_id: admin.id,
            type: 'referral_rejected' as const,
            title: 'Referral rejected',
            body: `Referral for case #${caseData?.case_number} was rejected${response_note ? `: "${response_note}"` : '.'}`,
            case_id: referral.case_id,
          }))
        );
      }

      res.status(200).json({ success: true, data: { id, status: 'rejected' } });
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
