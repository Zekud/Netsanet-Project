// Case routes — full CRUD for case management.
// POST   /cases              — survivor creates a case (AI triage)
// GET    /cases              — list cases (role-scoped, filterable, paginated)
// GET    /cases/:id          — single case detail
// PATCH  /cases/:id/status   — update case status (staff only)
// PATCH  /cases/:id/assign   — assign a worker (institution_admin only)
// GET    /cases/:id/activities  — audit trail
// POST   /cases/:id/activities  — add a manual note

import { Router, Response } from 'express';
import { body, query as queryParam, param, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { triageCase } from '../lib/gemini';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── POST /cases — Create a new case (survivor only) ─────────
router.post(
  '/',
  authenticate,
  requireRole('survivor'),
  [
    body('title')
      .isString()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title is required (3–200 characters)'),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description is required (at least 10 characters)'),
    body('incident_date')
      .optional()
      .isISO8601()
      .withMessage('Incident date must be a valid date'),
    body('location_text')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Location must be under 500 characters'),
    body('is_anonymous')
      .optional()
      .isBoolean()
      .withMessage('Anonymous flag must be true or false'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.mapped(),
          },
        });
        return;
      }

      const { title, description, incident_date, location_text, is_anonymous } = req.body;
      const survivorId = req.user!.id;

      // Call Gemini for AI triage classification
      let triageResult;
      try {
        triageResult = await triageCase(title, description);
      } catch (aiError) {
        console.error('Gemini triage failed, using fallback:', aiError);
        triageResult = {
          category: 'other' as const,
          urgency_level: 'medium' as const,
          summary: 'Case requires manual review — AI classification unavailable.',
          reasoning: 'AI triage service was temporarily unavailable.',
        };
      }

      // Find the default MoWSA institution to hold new cases
      const { data: mowsaInstitution } = await supabase
        .from('institutions')
        .select('id')
        .eq('type', 'mowsa')
        .eq('is_active', true)
        .limit(1)
        .single();

      // Insert case
      const { data: newCase, error: insertError } = await supabase
        .from('cases')
        .insert({
          survivor_id: survivorId,
          holding_institution_id: mowsaInstitution?.id || null,
          title,
          description,
          category: triageResult.category,
          urgency_level: triageResult.urgency_level,
          ai_summary: triageResult.summary,
          ai_raw_output: triageResult,
          incident_date: incident_date || null,
          location_text: location_text || null,
          is_anonymous: is_anonymous ?? false,
          status: 'new',
        })
        .select()
        .single();

      if (insertError || !newCase) {
        console.error(insertError);
        res.status(500).json({
          success: false,
          error: {
            code: 'CASE_CREATION_FAILED',
            message: 'Failed to create the case. Please try again.',
          },
        });
        return;
      }

      // Log activity
      const { error: activityError } = await supabase
        .from('case_activities')
        .insert({
          case_id: newCase.id,
          actor_id: survivorId,
          activity_type: 'case_created',
          description: 'Case submitted by survivor',
          metadata: {
            category: triageResult.category,
            urgency_level: triageResult.urgency_level,
          },
        });

      if (activityError) {
        console.error('Failed to log case activity:', activityError);
      }

      // Notify MoWSA institution_admin(s)
      if (mowsaInstitution?.id) {
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('institution_id', mowsaInstitution.id)
          .eq('role', 'institution_admin')
          .eq('is_active', true);

        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            user_id: admin.id,
            type: 'case_update' as const,
            title: 'New case received',
            body: `A new case #${newCase.case_number} requires review. Urgency: ${triageResult.urgency_level}.`,
            case_id: newCase.id,
          }));

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notifError) {
            console.error('Failed to create notifications:', notifError);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: {
          id: newCase.id,
          case_number: newCase.case_number,
          title: newCase.title,
          description: newCase.description,
          status: newCase.status,
          category: newCase.category,
          urgency_level: newCase.urgency_level,
          ai_summary: newCase.ai_summary,
          incident_date: newCase.incident_date,
          location_text: newCase.location_text,
          is_anonymous: newCase.is_anonymous,
          created_at: newCase.created_at,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while creating the case',
        },
      });
    }
  }
);

// ─── GET /cases — List cases with filters, search, pagination ─
router.get(
  '/',
  authenticate,
  [
    queryParam('status').optional().isString(),
    queryParam('urgency_level').optional().isString(),
    queryParam('category').optional().isString(),
    queryParam('assigned_worker_id').optional().isUUID(),
    queryParam('search').optional().isString().trim(),
    queryParam('page').optional().isInt({ min: 1 }).toInt(),
    queryParam('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryParam('sort_by').optional().isIn(['created_at', 'updated_at', 'urgency_level', 'status']),
    queryParam('sort_dir').optional().isIn(['asc', 'desc']),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const sortBy = (req.query.sort_by as string) || 'created_at';
      const sortDir = (req.query.sort_dir as string) || 'desc';

      let query = supabase
        .from('cases')
        .select(
          'id, case_number, title, status, category, urgency_level, ai_summary, is_anonymous, assigned_worker_id, holding_institution_id, survivor_id, created_at, updated_at',
          { count: 'exact' }
        );

      // ─── Role-based scoping ────────────────────────────
      if (user.role === 'survivor') {
        query = query.eq('survivor_id', user.id);
      } else if (user.role === 'case_worker') {
        query = query.eq('assigned_worker_id', user.id);
      } else if (user.role === 'institution_admin') {
        query = query.eq('holding_institution_id', user.institution_id);
      }
      // system_admin sees all — no filter

      // ─── Filters ───────────────────────────────────────
      if (req.query.status) {
        query = query.eq('status', req.query.status);
      }
      if (req.query.urgency_level) {
        query = query.eq('urgency_level', req.query.urgency_level);
      }
      if (req.query.category) {
        query = query.eq('category', req.query.category);
      }
      if (req.query.assigned_worker_id) {
        query = query.eq('assigned_worker_id', req.query.assigned_worker_id);
      }

      // Search on title and description using ilike
      if (req.query.search) {
        const searchTerm = `%${req.query.search}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      // ─── Sorting and Pagination ────────────────────────
      query = query
        .order(sortBy, { ascending: sortDir === 'asc' })
        .range(offset, offset + limit - 1);

      const { data: cases, error, count } = await query;

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch cases' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cases,
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

// ─── GET /cases/:id — Single case detail ──────────────────────
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const { data: caseData, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !caseData) {
        res.status(404).json({
          success: false,
          error: { code: 'CASE_NOT_FOUND', message: 'Case not found' },
        });
        return;
      }

      // Access control
      if (user.role === 'survivor' && caseData.survivor_id !== user.id) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You do not have permission to view this case' },
        });
        return;
      }

      if (user.role === 'case_worker' && caseData.assigned_worker_id !== user.id) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'This case is not assigned to you' },
        });
        return;
      }

      if (user.role === 'institution_admin' && caseData.holding_institution_id !== user.institution_id) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'This case does not belong to your institution' },
        });
        return;
      }

      // Mask survivor info if anonymous and the requester is staff
      const responseData = { ...caseData };
      if (caseData.is_anonymous && user.role !== 'survivor') {
        delete (responseData as Record<string, unknown>).survivor_name;
        delete (responseData as Record<string, unknown>).survivor_phone;
      }

      res.status(200).json({
        success: true,
        data: responseData,
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

// ─── PATCH /cases/:id/status — Update case status (staff only) ─
router.patch(
  '/:id/status',
  authenticate,
  requireRole('case_worker', 'institution_admin', 'system_admin'),
  [
    param('id').isUUID().withMessage('Invalid case ID'),
    body('status')
      .isIn(['new', 'under_review', 'referred', 'active', 'resolved', 'closed'])
      .withMessage('Invalid status value'),
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

      const { id } = req.params;
      const { status: newStatus } = req.body;
      const user = req.user!;

      // Fetch the case to verify access and get previous status
      const { data: existingCase, error: fetchError } = await supabase
        .from('cases')
        .select('id, case_number, status, survivor_id, assigned_worker_id, holding_institution_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingCase) {
        res.status(404).json({
          success: false,
          error: { code: 'CASE_NOT_FOUND', message: 'Case not found' },
        });
        return;
      }

      // Access control for case_worker and institution_admin
      if (user.role === 'case_worker' && existingCase.assigned_worker_id !== user.id) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'This case is not assigned to you' },
        });
        return;
      }

      if (user.role === 'institution_admin' && existingCase.holding_institution_id !== user.institution_id) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'This case does not belong to your institution' },
        });
        return;
      }

      const previousStatus = existingCase.status;

      // Update status
      const { data: updatedCase, error: updateError } = await supabase
        .from('cases')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError || !updatedCase) {
        console.error(updateError);
        res.status(500).json({
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Failed to update case status' },
        });
        return;
      }

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: id,
        actor_id: user.id,
        activity_type: 'status_changed',
        description: `Status changed from "${previousStatus}" to "${newStatus}"`,
        metadata: { previous_status: previousStatus, new_status: newStatus },
      });

      // Notify the survivor
      await supabase.from('notifications').insert({
        user_id: existingCase.survivor_id,
        type: 'case_update' as const,
        title: 'Case status updated',
        body: `Your case #${existingCase.case_number} status has been updated to "${newStatus.replace('_', ' ')}".`,
        case_id: id,
      });

      res.status(200).json({
        success: true,
        data: updatedCase,
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

// ─── PATCH /cases/:id/assign — Assign a worker (admin only) ───
router.patch(
  '/:id/assign',
  authenticate,
  requireRole('institution_admin', 'system_admin'),
  [
    param('id').isUUID().withMessage('Invalid case ID'),
    body('assigned_worker_id')
      .isUUID()
      .withMessage('Invalid worker ID'),
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

      const { id } = req.params;
      const { assigned_worker_id } = req.body;
      const user = req.user!;

      // Fetch the case to verify access
      const { data: existingCase, error: fetchError } = await supabase
        .from('cases')
        .select('id, case_number, holding_institution_id, assigned_worker_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingCase) {
        res.status(404).json({
          success: false,
          error: { code: 'CASE_NOT_FOUND', message: 'Case not found' },
        });
        return;
      }

      // Institution admins can only assign cases in their institution
      if (user.role === 'institution_admin' && existingCase.holding_institution_id !== user.institution_id) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'This case does not belong to your institution' },
        });
        return;
      }

      // Verify the worker exists and belongs to the same institution
      const { data: worker, error: workerError } = await supabase
        .from('users')
        .select('id, display_name, role, institution_id')
        .eq('id', assigned_worker_id)
        .eq('role', 'case_worker')
        .eq('is_active', true)
        .single();

      if (workerError || !worker) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_WORKER', message: 'The specified worker was not found or is not active' },
        });
        return;
      }

      // Update the case
      const { data: updatedCase, error: updateError } = await supabase
        .from('cases')
        .update({
          assigned_worker_id,
          status: existingCase.assigned_worker_id ? undefined : 'under_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError || !updatedCase) {
        console.error(updateError);
        res.status(500).json({
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Failed to assign case' },
        });
        return;
      }

      // Log activity
      await supabase.from('case_activities').insert({
        case_id: id,
        actor_id: user.id,
        activity_type: 'worker_assigned',
        description: `Case assigned to ${worker.display_name || 'a case worker'}`,
        metadata: {
          assigned_worker_id,
          assigned_worker_name: worker.display_name,
          assigned_by: user.id,
        },
      });

      // Notify the assigned worker
      await supabase.from('notifications').insert({
        user_id: assigned_worker_id,
        type: 'case_assigned' as const,
        title: 'New case assigned to you',
        body: `You have been assigned case #${existingCase.case_number}.`,
        case_id: id,
      });

      res.status(200).json({
        success: true,
        data: updatedCase,
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

// ─── GET /cases/:id/activities — Audit trail ──────────────────
router.get(
  '/:id/activities',
  authenticate,
  requireRole('case_worker', 'institution_admin', 'system_admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Verify case exists
      const { data: caseCheck, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('id', id)
        .single();

      if (caseError || !caseCheck) {
        res.status(404).json({
          success: false,
          error: { code: 'CASE_NOT_FOUND', message: 'Case not found' },
        });
        return;
      }

      const { data: activities, error } = await supabase
        .from('case_activities')
        .select('id, activity_type, description, metadata, created_at, actor_id')
        .eq('case_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'FETCH_FAILED', message: 'Failed to fetch activities' },
        });
        return;
      }

      // Enrich with actor display names
      const actorIds = [...new Set(activities?.map((a) => a.actor_id).filter(Boolean) || [])];
      let actorMap: Record<string, string> = {};

      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from('users')
          .select('id, display_name, role')
          .in('id', actorIds);

        if (actors) {
          actorMap = Object.fromEntries(
            actors.map((a) => [a.id, a.display_name || a.role])
          );
        }
      }

      const enrichedActivities = (activities || []).map((activity) => ({
        ...activity,
        actor_name: activity.actor_id ? actorMap[activity.actor_id] || 'Unknown' : 'System',
      }));

      res.status(200).json({
        success: true,
        data: enrichedActivities,
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

// ─── POST /cases/:id/activities — Add a manual note ───────────
router.post(
  '/:id/activities',
  authenticate,
  requireRole('case_worker', 'institution_admin', 'system_admin'),
  [
    param('id').isUUID().withMessage('Invalid case ID'),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Note is required (max 2000 characters)'),
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

      const { id } = req.params;
      const { description } = req.body;
      const user = req.user!;

      // Verify case exists
      const { data: caseCheck, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('id', id)
        .single();

      if (caseError || !caseCheck) {
        res.status(404).json({
          success: false,
          error: { code: 'CASE_NOT_FOUND', message: 'Case not found' },
        });
        return;
      }

      const { data: activity, error } = await supabase
        .from('case_activities')
        .insert({
          case_id: id,
          actor_id: user.id,
          activity_type: 'note_added',
          description,
        })
        .select()
        .single();

      if (error || !activity) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: { code: 'INSERT_FAILED', message: 'Failed to add note' },
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: activity,
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
