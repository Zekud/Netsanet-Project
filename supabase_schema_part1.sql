-- ============================================================
-- NETSANET DATABASE SCHEMA — Part 1: Tables & Enums
-- Run this FIRST in the Supabase SQL Editor.
-- ============================================================

-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('survivor', 'case_worker', 'institution_admin', 'system_admin');
CREATE TYPE institution_type AS ENUM ('mowsa', 'ewla', 'medical', 'shelter', 'ngo');
CREATE TYPE case_status AS ENUM ('new', 'under_review', 'referred', 'active', 'resolved', 'closed');
CREATE TYPE case_category AS ENUM ('legal', 'medical', 'shelter', 'counseling', 'other');
CREATE TYPE urgency_level AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE referral_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notification_type AS ENUM ('case_update', 'new_message', 'referral_received', 'referral_accepted', 'referral_rejected', 'case_assigned');

-- INSTITUTIONS
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type institution_type NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USERS (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'survivor',
  institution_id UUID REFERENCES institutions(id),
  display_name TEXT,
  phone TEXT,
  anonymous_mode BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CASES
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE NOT NULL DEFAULT '',
  survivor_id UUID NOT NULL REFERENCES users(id),
  holding_institution_id UUID REFERENCES institutions(id),
  assigned_worker_id UUID REFERENCES users(id),
  status case_status NOT NULL DEFAULT 'new',
  category case_category,
  urgency_level urgency_level,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ai_summary TEXT,
  ai_raw_output JSONB,
  incident_date DATE,
  location_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CASE ACTIVITY LOG
CREATE TABLE case_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REFERRALS
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  from_institution_id UUID NOT NULL REFERENCES institutions(id),
  to_institution_id UUID NOT NULL REFERENCES institutions(id),
  referred_by UUID NOT NULL REFERENCES users(id),
  status referral_status NOT NULL DEFAULT 'pending',
  note TEXT,
  response_note TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- EVIDENCE FILES
CREATE TABLE evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  case_id UUID REFERENCES cases(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI CHAT SESSIONS
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survivor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
