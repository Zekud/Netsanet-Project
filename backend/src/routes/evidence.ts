// Evidence routes — secure file management for case evidence.
// Mounted at: /api/v1/cases/:id/evidence  (parent param is :id, not :caseId)
// POST   /                      — upload file(s)
// GET    /                      — list evidence for a case
// GET    /:fileId/url            — get 60-min signed URL
// DELETE /:fileId               — delete a file

import { Router, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { param, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router({ mergeParams: true }); // mergeParams inherits :id from parent

// ─── Multer — memory storage, 50 MB max ────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4',
  'audio/mpeg', 'audio/wav',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not allowed`));
    }
  },
});

// ─── Access helper ─────────────────────────────────────────────

async function canAccessCase(
  userId: string,
  role: string,
  institutionId: string | null | undefined,
  caseId: string
): Promise<boolean> {
  const { data: c } = await supabase
    .from('cases')
    .select('survivor_id, holding_institution_id, assigned_worker_id')
    .eq('id', caseId)
    .single();

  if (!c) return false;
  if (role === 'survivor') return c.survivor_id === userId;
  if (role === 'case_worker') return c.assigned_worker_id === userId;
  if (role === 'institution_admin') return c.holding_institution_id === institutionId;
  if (role === 'system_admin') return true;
  return false;
}

// ─── POST / — Upload file(s) ───────────────────────────────────

router.post(
  '/',
  authenticate,
  upload.array('files', 10),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const caseId = req.params.id; // ← parent mounts with :id
      const user = req.user!;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, error: { code: 'NO_FILES', message: 'No files were uploaded' } });
        return;
      }

      const allowed = await canAccessCase(user.id, user.role, user.institution_id, caseId);
      if (!allowed) {
        res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'You do not have access to this case' } });
        return;
      }

      const uploaded: object[] = [];

      for (const file of files) {
        const fileId = randomUUID();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const storagePath = `${caseId}/${fileId}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('evidence-files')
          .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

        if (uploadError) {
          console.error('[evidence] Storage upload error:', uploadError.message);
          continue;
        }

        const { data: record, error: dbError } = await supabase
          .from('evidence_files')
          .insert({
            id: fileId,
            case_id: caseId,
            uploaded_by: user.id,
            file_name: file.originalname,
            storage_path: storagePath,
            mime_type: file.mimetype,
            size_bytes: file.size,
          })
          .select('id, file_name, mime_type, size_bytes, created_at')
          .single();

        if (dbError) {
          console.error('[evidence] DB insert error:', dbError.message);
          await supabase.storage.from('evidence-files').remove([storagePath]);
          continue;
        }

        uploaded.push(record);
      }

      await supabase.from('case_activities').insert({
        case_id: caseId,
        actor_id: user.id,
        activity_type: 'evidence_added',
        description: `${uploaded.length} evidence file(s) uploaded`,
        metadata: { file_count: uploaded.length },
      });

      res.status(201).json({ success: true, data: uploaded });
    } catch (error) {
      console.error('[evidence] Upload error:', error);
      res.status(500).json({ success: false, error: { code: 'UPLOAD_FAILED', message: 'File upload failed' } });
    }
  }
);

// ─── GET / — List evidence ─────────────────────────────────────

router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const caseId = req.params.id;
      const user = req.user!;

      const allowed = await canAccessCase(user.id, user.role, user.institution_id, caseId);
      if (!allowed) {
        res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Access denied' } });
        return;
      }

      const { data: files, error } = await supabase
        .from('evidence_files')
        .select('id, file_name, mime_type, size_bytes, created_at, uploaded_by')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to load evidence' } });
        return;
      }

      res.status(200).json({ success: true, data: files ?? [] });
    } catch (error) {
      console.error('[evidence] List error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── GET /:fileId/url — Signed download URL ────────────────────

router.get(
  '/:fileId/url',
  authenticate,
  [param('fileId').isUUID()],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid file ID' } });
        return;
      }

      const caseId = req.params.id;
      const { fileId } = req.params;
      const user = req.user!;

      const allowed = await canAccessCase(user.id, user.role, user.institution_id, caseId);
      if (!allowed) {
        res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Access denied' } });
        return;
      }

      const { data: file } = await supabase
        .from('evidence_files')
        .select('storage_path, file_name, mime_type')
        .eq('id', fileId)
        .eq('case_id', caseId)
        .single();

      if (!file) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found' } });
        return;
      }

      const { data: signed, error: signError } = await supabase.storage
        .from('evidence-files')
        .createSignedUrl(file.storage_path, 3600);

      if (signError || !signed) {
        res.status(500).json({ success: false, error: { code: 'URL_FAILED', message: 'Could not generate download URL' } });
        return;
      }

      res.status(200).json({
        success: true,
        data: { url: signed.signedUrl, expires_in: 3600, file_name: file.file_name, mime_type: file.mime_type },
      });
    } catch (error) {
      console.error('[evidence] Signed URL error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

// ─── DELETE /:fileId — Delete file ────────────────────────────

router.delete(
  '/:fileId',
  authenticate,
  [param('fileId').isUUID()],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid file ID' } });
        return;
      }

      const caseId = req.params.id;
      const { fileId } = req.params;
      const user = req.user!;

      const { data: file } = await supabase
        .from('evidence_files')
        .select('storage_path, uploaded_by')
        .eq('id', fileId)
        .eq('case_id', caseId)
        .single();

      if (!file) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found' } });
        return;
      }

      const canDelete =
        file.uploaded_by === user.id ||
        user.role === 'institution_admin' ||
        user.role === 'system_admin';

      if (!canDelete) {
        res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Cannot delete this file' } });
        return;
      }

      await supabase.storage.from('evidence-files').remove([file.storage_path]);
      await supabase.from('evidence_files').delete().eq('id', fileId);

      await supabase.from('case_activities').insert({
        case_id: caseId,
        actor_id: user.id,
        activity_type: 'evidence_removed',
        description: 'Evidence file removed',
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[evidence] Delete error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
    }
  }
);

export default router;
