// Auth routes — OTP-based passwordless authentication via Supabase Auth.
// Handles request-otp, verify-otp, logout, and first-time survivor registration.

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── POST /auth/request-otp ───────────────────────────────────
// Sends an OTP to the user's email (phone SMS for production, email for MVP).
router.post(
  '/request-otp',
  [
    body('email')
      .isEmail()
      .withMessage('A valid email address is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
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

      const { email } = req.body;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error(error);
        res.status(400).json({
          success: false,
          error: {
            code: 'OTP_REQUEST_FAILED',
            message: error.message,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'OTP sent successfully. Check your email.' },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send OTP',
        },
      });
    }
  }
);

// ─── POST /auth/verify-otp ───────────────────────────────────
// Verifies the OTP token. On first login, creates a users row with role='survivor'.
router.post(
  '/verify-otp',
  [
    body('email')
      .isEmail()
      .withMessage('A valid email address is required'),
    body('token')
      .isString()
      .isLength({ min: 6, max: 6 })
      .withMessage('A 6-digit OTP token is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
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

      const { email, token } = req.body;

      // Verify the OTP with Supabase
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (verifyError || !verifyData.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'OTP_INVALID',
            message: verifyError?.message || 'Invalid or expired OTP',
          },
        });
        return;
      }

      const authUser = verifyData.user;
      const accessToken = verifyData.session?.access_token;

      // Check if a users row already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = row not found — that's expected for first-time users
        console.error(fetchError);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user profile',
          },
        });
        return;
      }

      let userProfile = existingUser;

      // First-time user: create a users row with role='survivor'
      if (!userProfile) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            role: 'survivor',
            display_name: null,
            phone: authUser.phone || null,
            anonymous_mode: false,
            preferred_language: 'en',
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error(createError);
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create user profile',
            },
          });
          return;
        }

        userProfile = newUser;
      }

      res.status(200).json({
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: verifyData.session?.refresh_token || null,
          user: {
            id: userProfile.id,
            role: userProfile.role,
            display_name: userProfile.display_name,
            institution_id: userProfile.institution_id,
            email: authUser.email,
            phone: userProfile.phone,
            anonymous_mode: userProfile.anonymous_mode,
            preferred_language: userProfile.preferred_language,
          },
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify OTP',
        },
      });
    }
  }
);

// ─── POST /auth/logout ────────────────────────────────────────
// Signs the user out from Supabase Auth.
router.post(
  '/logout',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Sign out from Supabase (invalidates the session server-side)
      const { error } = await supabase.auth.admin.signOut(req.user!.id);

      if (error) {
        console.error(error);
        // Still return success — the token was likely already invalid
      }

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to logout',
        },
      });
    }
  }
);

// ─── GET /auth/me ─────────────────────────────────────────────
// Returns the current authenticated user's profile.
// For first-time users (no users row yet), auto-creates one with role='survivor'.
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      let { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user!.id)
        .single();

      // PGRST116 = row not found → first-time user, auto-create as survivor
      if (error && error.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: req.user!.id,
            role: 'survivor',
            display_name: null,
            phone: req.user!.phone || null,
            anonymous_mode: false,
            preferred_language: 'en',
            is_active: true,
          })
          .select()
          .single();

        if (createError || !newUser) {
          console.error(createError);
          res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to create user profile' },
          });
          return;
        }
        userProfile = newUser;
        error = null;
      }

      if (error || !userProfile) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User profile not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: userProfile.id,
          role: userProfile.role,
          display_name: userProfile.display_name,
          institution_id: userProfile.institution_id,
          email: req.user!.email,
          phone: userProfile.phone,
          anonymous_mode: userProfile.anonymous_mode,
          preferred_language: userProfile.preferred_language,
          is_active: userProfile.is_active,
          created_at: userProfile.created_at,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user profile' },
      });
    }
  }
);


export default router;
