// Shared TypeScript types for the Netsanet backend

import { Request } from 'express';

// ─── Database Enums ───────────────────────────────────────────

export type UserRole = 'survivor' | 'case_worker' | 'institution_admin' | 'system_admin';
export type InstitutionType = 'mowsa' | 'ewla' | 'medical' | 'shelter' | 'ngo';
export type CaseStatus = 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';
export type CaseCategory = 'legal' | 'medical' | 'shelter' | 'counseling' | 'other';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
export type ReferralStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType =
  | 'case_update'
  | 'new_message'
  | 'referral_received'
  | 'referral_accepted'
  | 'referral_rejected'
  | 'case_assigned';

// ─── Database Row Types ───────────────────────────────────────

export interface DbUser {
  id: string;
  role: UserRole;
  institution_id: string | null;
  display_name: string | null;
  phone: string | null;
  anonymous_mode: boolean;
  preferred_language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbInstitution {
  id: string;
  name: string;
  type: InstitutionType;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbCase {
  id: string;
  case_number: string;
  survivor_id: string;
  holding_institution_id: string | null;
  assigned_worker_id: string | null;
  status: CaseStatus;
  category: CaseCategory | null;
  urgency_level: UrgencyLevel | null;
  title: string;
  description: string;
  ai_summary: string | null;
  ai_raw_output: Record<string, unknown> | null;
  incident_date: string | null;
  location_text: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

// ─── API Envelope Types ───────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Authenticated Request ────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  institution_id: string | null;
  display_name: string | null;
  email?: string;
  phone?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
