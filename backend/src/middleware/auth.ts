// JWT authentication middleware — verifies the Supabase access token
// from the Authorization header and attaches the user profile to req.user.

import { Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest, DbUser } from '../types';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[auth] ❌ No Bearer token in Authorization header');
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header with Bearer token is required',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    console.log('[auth] 🔑 Token received, length:', token.length);

    // Verify the JWT with Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      console.log('[auth] ❌ Token rejected by Supabase:', authError?.message);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
        },
      });
      return;
    }

    console.log('[auth] ✅ Auth user verified:', authUser.id);

    // Fetch the user's profile from our users table
    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, institution_id, display_name, phone')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      // Auto-provision first-time users as 'survivor'
      if (profileError?.code === 'PGRST116') {
        console.log('[auth] 🆕 First-time user, auto-creating survivor profile for:', authUser.id);
        const { data: newProfile, error: createError } = await supabase
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
          .select('id, role, institution_id, display_name, phone')
          .single();

        if (createError || !newProfile) {
          console.log('[auth] ❌ Failed to auto-create user:', createError?.message);
          res.status(500).json({
            success: false,
            error: { code: 'PROVISION_FAILED', message: 'Failed to create user profile' },
          });
          return;
        }

        profile = newProfile;
      } else {
        console.log('[auth] ❌ User profile not found in users table. Auth ID:', authUser.id, 'Error:', profileError?.message);
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found. Account may not be fully set up.',
          },
        });
        return;
      }
    }

    const dbProfile = profile as DbUser;

    // Check if the user account is active
    if (dbProfile.is_active === false) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated. Contact an administrator.',
        },
      });
      return;
    }

    // Attach user info to the request
    req.user = {
      id: dbProfile.id,
      role: dbProfile.role,
      institution_id: dbProfile.institution_id,
      display_name: dbProfile.display_name,
      email: authUser.email,
      phone: dbProfile.phone ?? undefined,
    };

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An internal error occurred during authentication',
      },
    });
  }
}
