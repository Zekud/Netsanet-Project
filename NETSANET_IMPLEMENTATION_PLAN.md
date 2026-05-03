# NETSANET — Full Implementation Plan
> Paste this entire file into your Agentic IDE as project context.  
> It tells the agent exactly what to build, in what order, in what folder, and how each piece connects.

---

## PROJECT OVERVIEW

Netsanet is a B2B2C web platform for GBV (Gender-Based Violence) survivor support in Ethiopia. It has two portals:

1. **Survivor Portal** — A safe, anonymous-first web app where survivors report incidents, track their case, chat with an AI Legal Guide (RAG-powered), upload evidence, and message their assigned case manager.
2. **Institution Dashboard** — A case management system used by MoWSA (intake), EWLA (legal aid), and a System Admin. Cases flow from MoWSA → EWLA via a referral system.

**AI Classification:** When a survivor submits a case, Gemini reads the description and returns a category + urgency + summary. No ML training data needed — pure prompt engineering.

**RAG:** Already built in a separate repo (`lawgen-rag`). We clone it, ingest Ethiopian legal PDFs once, and call its `POST /ask` endpoint from our backend. We do NOT rebuild it.

---

## MONOREPO STRUCTURE

```
netsanet/
├── backend/          ← Node.js + Express + TypeScript (YOU BUILD THIS)
├── frontend/         ← React + Vite + TypeScript + Tailwind (YOU BUILD THIS)
├── rag-service/      ← Cloned from lawgen-rag repo (CLONE, DON'T REWRITE)
├── docker-compose.yml
└── .env.example
```

Everything lives in one monorepo. The `rag-service/` is a git subtree or submodule — clone it and leave its internal code alone. Only wire it up.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State / Data fetching | TanStack Query (React Query) v5 |
| Routing | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| Database + Auth + Storage | Supabase (PostgreSQL + Auth OTP + Storage) |
| Realtime (notifications + chat) | Supabase Realtime (built-in websockets) |
| AI Classification | Google Gemini 1.5 Flash via REST API |
| RAG Chat | Existing `lawgen-rag` FastAPI service (Python) |
| File Storage | Supabase Storage (private bucket, signed URLs) |
| Deployment | Railway.app (all services) |

---

## USER ROLES & HIERARCHY

```
system_admin          ← Approves institutions, manages platform
  └── institution_admin   ← Manages their own staff (MoWSA admin, EWLA admin)
        └── case_worker   ← Handles assigned cases (MoWSA workers, EWLA lawyers)

survivor              ← Completely separate portal, anonymous-first
```

**Key rule:** `system_admin` never touches individual cases. `institution_admin` manages their staff roster and accepts/rejects referrals from other institutions. `case_worker` does the actual case work.

---

## DATABASE SCHEMA

Run this SQL in Supabase SQL Editor to create all tables. Create these FIRST before writing any backend code.

```sql
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
  is_active BOOLEAN DEFAULT false, -- system_admin approves
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USERS (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'survivor',
  institution_id UUID REFERENCES institutions(id),  -- null for survivors
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
  case_number TEXT UNIQUE NOT NULL, -- auto-generated e.g. NS-2024-1042
  survivor_id UUID NOT NULL REFERENCES users(id),
  holding_institution_id UUID REFERENCES institutions(id), -- who currently owns the case
  assigned_worker_id UUID REFERENCES users(id),           -- specific worker within that institution
  status case_status NOT NULL DEFAULT 'new',
  category case_category,          -- set by Gemini
  urgency_level urgency_level,     -- set by Gemini
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ai_summary TEXT,                 -- Gemini's one-line summary
  ai_raw_output JSONB,             -- full Gemini response for audit
  incident_date DATE,
  location_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CASE ACTIVITY LOG (audit trail + survivor status timeline)
CREATE TABLE case_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id), -- null = system
  activity_type TEXT NOT NULL,  -- 'status_change','note','referral_sent','referral_accepted','assigned','evidence_added'
  description TEXT NOT NULL,    -- human-readable log line
  metadata JSONB,               -- e.g. { old_status: 'new', new_status: 'under_review' }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REFERRALS
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  from_institution_id UUID NOT NULL REFERENCES institutions(id),
  to_institution_id UUID NOT NULL REFERENCES institutions(id),
  referred_by UUID NOT NULL REFERENCES users(id),  -- the case_worker who sent it
  status referral_status NOT NULL DEFAULT 'pending',
  note TEXT,                     -- message to receiving institution
  response_note TEXT,            -- accepting/rejecting institution's response
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MESSAGES (case-scoped chat between survivor and current assigned worker)
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
  storage_path TEXT NOT NULL,  -- Supabase storage path (never store public URL)
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
  case_id UUID REFERENCES cases(id),  -- link back to relevant case
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI CHAT SESSIONS (RAG Legal Guide - survivors only)
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
  sources JSONB,  -- RAG source chunks returned with assistant messages
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HELPER FUNCTION: auto-generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  seq_val INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_val FROM cases;
  RETURN 'NS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: set case_number on insert
CREATE OR REPLACE FUNCTION set_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := generate_case_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_case_number
  BEFORE INSERT ON cases
  FOR EACH ROW EXECUTE FUNCTION set_case_number();

-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('evidence-files', 'evidence-files', false);
```

---

## SUPABASE REALTIME SETUP

Enable Realtime on these tables in Supabase dashboard → Table Editor → Realtime toggle:
- `messages`
- `notifications`
- `cases` (for status updates)
- `referrals`

This replaces the need for a custom WebSocket server. The frontend subscribes directly; the backend writes to these tables and Supabase broadcasts automatically.

---

## ENVIRONMENT VARIABLES

Create these files. Never commit `.env` — commit only `.env.example` with empty values.

### `backend/.env`
```
PORT=3001
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # service_role key (bypasses RLS)
SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIza...
RAG_SERVICE_URL=http://localhost:8000   # lawgen-rag service
INTERNAL_RAG_KEY=some-random-secret    # if you add auth to RAG
JWT_SECRET=supabase-jwt-secret         # from Supabase project settings
```

### `frontend/.env`
```
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### `rag-service/.env`
```
GOOGLE_API_KEY=AIza...
# Azure keys only if you use STT/TTS — not needed for this MVP
```

---

## PHASE 1 — PROJECT SCAFFOLD & AUTH
**Goal:** Both portals load, OTP login works end-to-end, roles redirect correctly.

### 1A — Backend Scaffold

```
backend/
├── src/
│   ├── index.ts              ← Express app entry point
│   ├── middleware/
│   │   ├── auth.ts           ← Verify Supabase JWT, attach req.user
│   │   └── requireRole.ts    ← Role guard middleware
│   ├── lib/
│   │   ├── supabase.ts       ← Supabase admin client (service key)
│   │   └── gemini.ts         ← Gemini API helper
│   └── routes/
│       └── auth.ts           ← POST /auth/request-otp, POST /auth/verify-otp
├── package.json
└── tsconfig.json
```

**`src/middleware/auth.ts`** — Verify JWT from Authorization header using Supabase's `auth.getUser()`. Attach user + role to `req.user`. Return 401 if invalid.

**`src/middleware/requireRole.ts`** — Factory middleware: `requireRole('case_worker', 'institution_admin')`. Reads `req.user.role`. Returns 403 if role not in allowed list.

**Auth flow (OTP, passwordless):**
- `POST /api/v1/auth/request-otp` — call `supabase.auth.signInWithOtp({ phone or email })`. Returns `{ success: true }`.
- `POST /api/v1/auth/verify-otp` — call `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`. On success, fetch user record from `users` table, return `{ access_token, user: { id, role, display_name, institution_id } }`.
- `POST /api/v1/auth/logout` — call `supabase.auth.signOut()`.

**First-time user setup:** After OTP verify, check if a `users` row exists for this auth user. If not, create one with `role = 'survivor'`. Staff accounts are created by institution_admin (never self-register as staff).

### 1B — Frontend Scaffold

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx               ← Router setup
│   ├── lib/
│   │   ├── supabase.ts       ← Supabase client (anon key)
│   │   ├── api.ts            ← Axios instance with JWT interceptor
│   │   └── queryClient.ts    ← TanStack Query client
│   ├── hooks/
│   │   └── useAuth.ts        ← Auth state, login, logout
│   ├── context/
│   │   └── AuthContext.tsx   ← Global auth context
│   ├── components/
│   │   └── ui/               ← Shared components (see list below)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── VerifyOtpPage.tsx
│   │   ├── survivor/         ← Survivor portal pages
│   │   └── dashboard/        ← Staff dashboard pages
│   └── routes/
│       └── ProtectedRoute.tsx ← Redirect if not authed or wrong role
├── tailwind.config.ts
└── vite.config.ts
```

**Tailwind config — use this exact color palette to match Figma designs:**
```js
// tailwind.config.ts
colors: {
  teal: {
    50: '#E8F5F3', 100: '#B2DDD8', 500: '#1A7A6E', 700: '#145F56', 900: '#0D3D38'
  },
  slate: { /* defaults */ },
  // Keep rest as Tailwind defaults
}
```

**Design direction for the IDE:** The UI should feel calm, trustworthy, and human — NOT clinical or corporate. Use the teal palette from the Figma designs. Survivor pages should feel like a safe space — soft backgrounds, generous spacing, no sharp angles. Dashboard pages should be clean and functional — data-dense but not overwhelming. Use `Instrument Serif` or `DM Serif Display` for headings and `DM Sans` for body text. Avoid rounded-2xl on everything — vary the radius intentionally.

**Route structure:**
```
/                           → redirect based on role after login
/login                      → LoginPage (public)
/login/verify               → VerifyOtpPage (public)

/safe-space                 → SurvivorLayout (role: survivor)
/safe-space/home            → SurvivorHome
/safe-space/report          → ReportCasePage
/safe-space/cases           → MyCasesPage
/safe-space/cases/:id       → CaseDetailPage (survivor view)
/safe-space/chat            → AILegalGuidePage
/safe-space/evidence/:caseId → EvidenceLockerPage

/dashboard                  → DashboardLayout (roles: case_worker, institution_admin, system_admin)
/dashboard/home             → DashboardHome
/dashboard/cases            → CaseDirectoryPage
/dashboard/cases/:id        → CaseAssessmentPage
/dashboard/staff            → StaffManagementPage (institution_admin+)
/dashboard/referrals        → ReferralsPage
/dashboard/analytics        → AnalyticsPage (institution_admin+)
/dashboard/institutions     → InstitutionsPage (system_admin only)
/dashboard/notifications    → NotificationsPage
```

**`ProtectedRoute`** — checks `useAuth()` state. If not logged in → `/login`. If wrong role → `/unauthorized`.

**After OTP verify:** redirect based on role:
- `survivor` → `/safe-space/home`
- `case_worker` → `/dashboard/home`
- `institution_admin` → `/dashboard/home`
- `system_admin` → `/dashboard/institutions`

### 1C — Shared UI Components to Build First

Build these in `frontend/src/components/ui/` before building any pages. Every page uses them.

```
Badge.tsx           ← status/urgency colored pill
Button.tsx          ← primary, secondary, ghost, danger variants
Card.tsx            ← wrapper with optional header
ChatBubble.tsx      ← survivor / staff / AI variants
EmptyState.tsx      ← for empty lists
FileUploadZone.tsx  ← drag-and-drop with preview
Input.tsx           ← text input with label + error
KpiCard.tsx         ← metric card with icon + number
Modal.tsx           ← generic dialog
PageHeader.tsx      ← title + breadcrumb + optional action button
QuickExitButton.tsx ← ALWAYS visible on survivor pages; on click: sessionStorage.clear() → window.location.replace('https://google.com')
Spinner.tsx         ← loading state
StatusBadge.tsx     ← maps case_status to color + label
UrgencyBadge.tsx    ← maps urgency_level to color + icon
NotificationBell.tsx ← bell icon with unread count badge
```

---

## PHASE 2 — CASE SUBMISSION + AI TRIAGE
**Goal:** Survivor submits a case → Gemini classifies it → case appears in MoWSA dashboard instantly.

### 2A — Backend: POST /api/v1/cases

**File:** `backend/src/routes/cases.ts`

```
POST /api/v1/cases
Auth: JWT (role: survivor)
```

**Handler logic — do these steps in order:**

1. Validate request body (title, description required; incident_date, location_text optional).
2. Call Gemini for triage (see Gemini prompt below).
3. Insert into `cases` table with Gemini results.
4. Insert a `case_activities` row: `{ activity_type: 'case_created', description: 'Case submitted by survivor' }`.
5. Create a `notifications` row for the MoWSA institution_admin: `{ type: 'case_update', title: 'New case received', body: 'A new case #NS-XXXX requires review.' }`.
6. Return the created case.

**Gemini triage prompt — use exactly this:**
```javascript
// lib/gemini.ts
export async function triageCase(title: string, description: string) {
  const prompt = `You are a case triage assistant for a women's support platform in Ethiopia.
Analyze this incident report and respond ONLY with a valid JSON object, no explanation.

Title: ${title}
Description: ${description}

Respond with exactly this JSON structure:
{
  "category": "legal" | "medical" | "shelter" | "counseling" | "other",
  "urgency_level": "critical" | "high" | "medium" | "low",
  "summary": "One sentence summary of the case in plain language",
  "reasoning": "Brief explanation of why this category and urgency"
}

Urgency guide:
- critical: immediate physical danger, life at risk
- high: ongoing abuse, needs help within 24 hours
- medium: situation is serious but not immediately dangerous
- low: information request, past incident, no immediate risk`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  // Strip markdown code fences if Gemini wraps in ```json
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
```

### 2B — Frontend: ReportCasePage

**Route:** `/safe-space/report`

**UI elements:**
- Page title: "Tell us what happened" (not "Submit a case" — keep it human)
- `QuickExitButton` always visible top-right
- Anonymous mode toggle (if on, survivor's name is hidden from workers)
- Textarea for description (large, no word limit shown — don't make them feel judged)
- Optional: date picker for incident date, location text field
- Optional category hint (a soft question like "What kind of help do you need most?" with radio buttons: Legal Help / Medical / Safe Place to Stay / Someone to Talk To / Not Sure)
- Submit button: "Send My Report Securely"
- After submit: show confirmation screen with case number, NOT a redirect back to form

**Loading state during submit:** Show "We're reviewing your case securely..." with a subtle animation — NOT a generic spinner. This moment matters.

---

## PHASE 3 — CASE MANAGEMENT DASHBOARD (MoWSA/Staff)

### 3A — Backend: Case Routes

```
GET  /api/v1/cases                  ← list cases (staff sees their institution's cases)
GET  /api/v1/cases/:id              ← case detail
PATCH /api/v1/cases/:id/status      ← update status
PATCH /api/v1/cases/:id/assign      ← assign to a specific worker
GET  /api/v1/cases/:id/activities   ← audit trail
POST /api/v1/cases/:id/activities   ← add a manual note
```

**`GET /api/v1/cases` scoping rules:**
- `case_worker` → only cases where `assigned_worker_id = req.user.id`
- `institution_admin` → all cases where `holding_institution_id = req.user.institution_id`
- `system_admin` → all cases

**Query params to support:** `status`, `urgency_level`, `category`, `assigned_worker_id`, `search` (full-text on title+description), `page`, `limit`, `sort_by`, `sort_dir`

**`PATCH /api/v1/cases/:id/status` — also:**
- Insert a `case_activities` row logging the status change.
- Insert a `notifications` row for the survivor: "Your case status has been updated to [new_status]."

**`PATCH /api/v1/cases/:id/assign` — also:**
- Insert a `notifications` row for the assigned worker: "You have been assigned case #NS-XXXX."

### 3B — Frontend: CaseDirectoryPage

**Route:** `/dashboard/cases`

**UI:** Data table with columns: Case #, Urgency (colored badge), Category, Status (colored badge), Survivor (masked if anonymous), Assigned To, Submitted Date, Actions.

**Filters bar above table:** Status filter (chips, not dropdown), Urgency filter (chips), search input, "Unassigned only" toggle.

**Table row click** → navigate to `/dashboard/cases/:id`

**Design note for IDE:** The urgency badges must be visually distinct and impossible to miss:
- `critical` → solid red background, white text, pulsing dot animation
- `high` → orange background
- `medium` → amber background
- `low` → gray background

### 3C — Frontend: CaseAssessmentPage

**Route:** `/dashboard/cases/:id`

This is the most important staff page. Layout is two-column:

**Left column (70%):**
- Case header: case number, status badge, urgency badge, submitted date
- Survivor info section (masked if anonymous_mode = true — show "Anonymous Survivor")
- AI Triage Summary box: show `ai_summary`, category, urgency with Gemini's reasoning
- Incident details: description, date, location
- Evidence files list with download buttons
- Activity/audit log timeline at the bottom

**Right column (30%):**
- Action panel:
  - Status update dropdown + "Update Status" button
  - Assign to worker dropdown (shows workers in institution) + "Assign" button
  - "Refer Case" button → opens Modal (see Phase 4)
- Case messaging panel (see Phase 5)

---

## PHASE 4 — REFERRAL SYSTEM

### 4A — Backend: Referral Routes

```
POST /api/v1/cases/:id/referrals         ← send referral (case_worker / institution_admin)
GET  /api/v1/referrals/incoming          ← referrals sent TO my institution (institution_admin)
GET  /api/v1/referrals/outgoing          ← referrals sent FROM my institution
PATCH /api/v1/referrals/:id/accept       ← accept referral
PATCH /api/v1/referrals/:id/reject       ← reject referral
```

**`POST /api/v1/cases/:id/referrals` logic:**
1. Validate: case must be `holding_institution_id = req.user.institution_id` (can't refer a case you don't hold).
2. Insert `referrals` row with `status = 'pending'`.
3. Update case `status = 'referred'`.
4. Insert `case_activities` row.
5. Insert `notifications` for the target institution's `institution_admin` users: "You have received a referral for case #NS-XXXX."
6. Return referral object.

**`PATCH /api/v1/referrals/:id/accept` logic:**
1. Update referral `status = 'accepted'`, `responded_at = now()`.
2. Update case: `holding_institution_id = accepting institution`, `assigned_worker_id = null` (institution_admin will assign to a specific worker), `status = 'active'`.
3. Insert `case_activities`.
4. Notify the referring institution's admin: "Referral for #NS-XXXX was accepted by [institution name]."
5. Notify the survivor: "Your case has been accepted by a new support team."

**`PATCH /api/v1/referrals/:id/reject` logic:**
1. Update referral `status = 'rejected'`.
2. Revert case `status` back to `'under_review'`, keep `holding_institution_id` unchanged.
3. Insert `case_activities`.
4. Notify the referring institution's admin of rejection with the `response_note`.

### 4B — Frontend: ReferralsPage + Refer Modal

**ReferralsPage** (`/dashboard/referrals`):
- Two tabs: "Incoming" and "Outgoing"
- Each referral card shows: case number, from/to institution, status badge, date, note
- Incoming tab: "Accept" and "Reject" buttons on each pending referral (open a small modal for response_note)

**Refer Modal** (triggered from CaseAssessmentPage):
- Dropdown: "Refer to institution" — fetches `GET /api/v1/institutions` (active ones only, excluding sender's own)
- Textarea: "Note to receiving institution" (optional but encouraged)
- Submit button: "Send Referral"

---

## PHASE 5 — MESSAGING (CASE-SCOPED CHAT)

### 5A — Backend: Message Routes

```
GET  /api/v1/cases/:id/messages   ← fetch message history
POST /api/v1/cases/:id/messages   ← send a message
POST /api/v1/cases/:id/messages/read ← mark all as read
```

**Access rule for `GET` and `POST`:**
- Survivor: only their own cases
- Case worker: only cases where they are `assigned_worker_id`
- Institution admin: any case their institution holds

**`POST` logic:**
1. Insert message into `messages` table.
2. Supabase Realtime broadcasts to all subscribers on this case's channel automatically.
3. Insert `notifications` for the OTHER party (if survivor sends → notify worker; if worker sends → notify survivor). Check `is_read` to avoid spam.

### 5B — Frontend: Chat Panel + Realtime

**Where it lives:** Inside CaseAssessmentPage (staff) and CaseDetailPage (survivor) — a panel, not a separate page.

**Supabase Realtime subscription:**
```typescript
// In the chat component's useEffect
const channel = supabase
  .channel(`case-messages-${caseId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `case_id=eq.${caseId}`
  }, (payload) => {
    // append new message to local state
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();

return () => { supabase.removeChannel(channel); };
```

**Chat UI:** Survivor messages right-aligned teal bubble. Worker messages left-aligned white bubble with worker name. Timestamps small and subtle. Input bar pinned to bottom of panel. "Send" on Enter.

---

## PHASE 6 — NOTIFICATIONS

### 6A — Backend: Notification Routes

```
GET   /api/v1/notifications         ← get my notifications (paginated)
PATCH /api/v1/notifications/read-all ← mark all as read
PATCH /api/v1/notifications/:id/read ← mark one as read
```

All notification inserts happen within other route handlers (case creation, status update, referral, message) — no separate notification service needed.

### 6B — Frontend: Realtime Notification Bell

**`NotificationBell` component** in the top nav of both layouts:
```typescript
// Subscribe to new notifications for current user
const channel = supabase
  .channel(`notifications-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // increment unread count, show toast
    setUnreadCount(prev => prev + 1);
    showToast(payload.new.title, payload.new.body);
  })
  .subscribe();
```

**Notification dropdown:** Click bell → dropdown panel shows last 20 notifications grouped by today / earlier. Each item shows title, body, relative time ("2 minutes ago"), and a colored left border by type. Click notification → navigate to relevant case. "Mark all read" button at top of dropdown.

**Toast notifications:** Small pop-up bottom-right corner, auto-dismiss after 4 seconds, shows title + body, click to navigate.

---

## PHASE 7 — RAG AI LEGAL GUIDE

### 7A — RAG Service Setup (Already Done — Just Run It)

The rag-service/ already contains a pre-built ChromaDB vector index 
with Ethiopian legal documents. No ingestion needed.

\```bash
cd rag-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # only GOOGLE_API_KEY needed if you use STT/TTS
                           # the /ask endpoint needs NO API key at runtime

uvicorn app.main:app --host 0.0.0.0 --port 8000

# Verify it works immediately:
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the conditions for a valid marriage in Ethiopia?", "k": 5}'
\```

You should get back law chunks immediately. If you do, the RAG service is 
ready — move straight to Phase 7B.

### DO NOT:
- Run pdf_processor.py (not needed)
- Run ingestion_pipeline.py (not needed, will overwrite the existing index)
- Delete or move anything inside legal_db/ (this IS the database)
\```

### 7B — Backend: AI Chat Routes

```
POST /api/v1/ai/chat              ← send message to RAG + Gemini, get answer
GET  /api/v1/ai/sessions          ← list survivor's chat sessions
GET  /api/v1/ai/sessions/:id      ← get session message history
DELETE /api/v1/ai/sessions/:id    ← delete session (privacy)
```

**`POST /api/v1/ai/chat` logic:**
```
Auth: JWT (role: survivor)
Body: { message: string, session_id?: string, language?: 'en' | 'am' }
```

1. If no `session_id`, create a new `ai_chat_sessions` row, get its ID.
2. Save the user's message to `ai_chat_messages` table.
3. Call RAG service: `POST http://RAG_SERVICE_URL/ask` with `{ query: message, k: 5 }`.
4. Take the returned chunks. Build a Gemini prompt:

```javascript
const ragPrompt = `You are a compassionate legal guide for Ethiopian women who have experienced 
gender-based violence. Answer ONLY based on the legal context provided below.
If the context doesn't contain relevant information, say so honestly — do not invent legal facts.
Be warm, clear, and non-judgmental. Use simple language.
${language === 'am' ? 'Respond in Amharic.' : 'Respond in English.'}

Legal Context:
${ragChunks.map(c => `[${c.source} - Article ${c.article_number}]\n${c.content}`).join('\n\n')}

User Question: ${message}`;
```

5. Call Gemini with this prompt, get the answer.
6. Save assistant message to `ai_chat_messages` with `sources = ragChunks`.
7. Update `ai_chat_sessions.last_active_at`.
8. Return: `{ answer, session_id, sources: ragChunks, suggested_questions }`.

**Suggested questions** — add a second small Gemini call or hardcode 3 contextual follow-up questions based on the category of question asked. For MVP, hardcode per category:
- Legal: ["How do I file a protection order?", "What documents do I need?", "Can I get legal aid for free?"]
- Family: ["What are my rights regarding custody?", "How is property divided?", "Can I divorce without a lawyer?"]

### 7C — Frontend: AILegalGuidePage

**Route:** `/safe-space/chat`

**Design direction:** This is the most AI-forward page. It should feel like talking to a knowledgeable, calm friend — NOT a chatbot widget. Full-page layout. Left panel (30%): session list (today, this week, older). Right panel (70%): active conversation.

**UI elements:**
- Conversation list sidebar: each session shows first message, relative date. "New conversation" button at top.
- Chat area: messages in bubbles. User = right-aligned teal. AI = left-aligned with a small Netsanet icon avatar.
- After AI response: collapsible "Sources" section below the message showing which legal articles were used.
- Suggested follow-up questions as tappable chips below the AI response.
- Input bar: textarea (grows with content), send button, mic icon (for future voice — placeholder for now).
- `QuickExitButton` always visible.

**Disclaimer banner:** Fixed at top of chat area — "This AI provides legal information only, not legal advice. For specific legal action, always consult a qualified lawyer."

---

## PHASE 8 — EVIDENCE UPLOAD

### 8A — Backend: Evidence Routes

```
POST   /api/v1/cases/:id/evidence          ← upload file (multipart/form-data)
GET    /api/v1/cases/:id/evidence          ← list evidence files for a case
GET    /api/v1/cases/:id/evidence/:fileId/url ← get 60-min signed URL
DELETE /api/v1/cases/:id/evidence/:fileId  ← delete a file
```

**`POST` upload logic:**
```javascript
// Use multer for multipart parsing
// Then upload to Supabase Storage:
const filePath = `${caseId}/${fileId}-${sanitizedFileName}`;
const { data, error } = await supabase.storage
  .from('evidence-files')
  .upload(filePath, fileBuffer, { contentType: mimeType, upsert: false });

// Save metadata to evidence_files table (store filePath, NOT a URL)
// Insert case_activities row: 'Evidence file added'
```

**`GET signed URL` logic:**
```javascript
const { data } = await supabase.storage
  .from('evidence-files')
  .createSignedUrl(storagePath, 3600); // expires in 60 minutes
return { url: data.signedUrl, expires_in: 3600 };
```

**Accepted file types:** `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `audio/mpeg`, `audio/wav`, `application/pdf`. Max 50MB per file.

### 8B — Frontend: EvidenceLockerPage

**Route:** `/safe-space/evidence/:caseId` (also shown in CaseDetailPage as a tab)

**UI:** Grid of uploaded files. Each card shows: file type icon (image thumbnail if photo, PDF icon, audio waveform icon), file name, upload date, size. Hover → "View" button (opens signed URL in new tab) and "Delete" button (with confirmation modal).

Top: `FileUploadZone` component — drag-and-drop area with file type guidance: "Photos, videos, audio recordings, and PDFs are accepted. Maximum 50MB per file." Multiple files at once supported.

---

## PHASE 9 — SURVIVOR PORTAL PAGES

### SurvivorHome (`/safe-space/home`)

This is the first thing a survivor sees after login. Keep it calm and reassuring.

Layout:
- Large greeting: "You are in a safe space, [name]." (or "You are in a safe space." if anonymous)
- Two primary action cards side by side:
  - "Report an Incident" → `/safe-space/report`
  - "Talk to Legal AI Guide" → `/safe-space/chat`
- Section: "Your Active Cases" — shows max 3 most recent cases as compact cards with status badge. "See all" link.
- Section: "Resources" — static cards linking to: Your Rights (links to RAG chat with pre-filled question), Emergency Contacts (hardcoded Ethiopian emergency numbers), Local Support Centers (static list of MoWSA offices).
- `QuickExitButton` always visible top-right.

### CaseDetailPage — Survivor View (`/safe-space/cases/:id`)

Layout — single column, mobile-friendly:
- Case header: case number, current status as a visual progress timeline (new → under review → referred → active → resolved)
- AI Summary box: "Here's what our system noted about your case:" + `ai_summary`
- Status updates timeline: chronological `case_activities` items written in survivor-friendly language (translate technical activity_types to plain language: "under_review" → "A case manager is reviewing your case")
- Case messaging panel: chat with assigned worker (or "Your case has not yet been assigned to a case manager" if `assigned_worker_id` is null)
- Evidence section: link to evidence locker

---

## PHASE 10 — ADMIN FEATURES

### 10A — System Admin: InstitutionsPage (`/dashboard/institutions`)

Only accessible to `system_admin`.

**Backend routes:**
```
GET  /api/v1/institutions            ← list all institutions
POST /api/v1/institutions            ← create new institution
PATCH /api/v1/institutions/:id       ← update (includes is_active toggle)
GET  /api/v1/institutions/:id/staff  ← list staff of an institution
```

**UI:** Table of institutions with Name, Type, Status (Active/Pending), Staff Count, Actions. "Approve" button on inactive ones. "Add Institution" button → modal form.

### 10B — Institution Admin: StaffManagementPage (`/dashboard/staff`)

Only accessible to `institution_admin`.

**Backend routes:**
```
GET  /api/v1/staff                   ← list staff in my institution
POST /api/v1/staff                   ← create staff account (sends OTP invite)
PATCH /api/v1/staff/:id              ← update role or deactivate
```

**`POST /api/v1/staff` logic:**
1. Create Supabase auth user with phone/email.
2. Insert `users` row with `role = 'case_worker'` and `institution_id = req.user.institution_id`.
3. Supabase sends OTP to the new staff member's phone/email automatically.

**UI:** Table of staff with Name, Role, Cases Assigned (count), Status, Actions. "Add Staff Member" → modal with name, phone/email, role fields.

### 10C — Analytics Page (`/dashboard/analytics`)

**Backend:**
```
GET /api/v1/analytics/overview       ← KPI summary
GET /api/v1/analytics/by-status      ← breakdown
GET /api/v1/analytics/by-category    ← breakdown
GET /api/v1/analytics/trend          ← cases per day/week (query param: period=7d|30d|90d)
```

Scope: `institution_admin` sees only their institution's data. `system_admin` sees all.

**UI:** Dashboard with KPI cards row at top (Total Cases, Open Cases, Avg Resolution Days, Critical Cases). Below: two charts side by side using Recharts — Donut chart for status breakdown, Bar chart for cases per day trend. Below: Category breakdown as horizontal bar chart.

---

## PHASE 11 — WIRING EVERYTHING TOGETHER

Once all phases are built independently, do this integration pass:

### docker-compose.yml (for local full-stack testing)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["3001:3001"]
    env_file: ./backend/.env
    depends_on: [rag]

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    env_file: ./frontend/.env

  rag:
    build: ./rag-service
    ports: ["8000:8000"]
    env_file: ./rag-service/.env
    volumes:
      - ./rag-service/app/legal_db:/app/app/legal_db  # persist ChromaDB
```

### Railway Deployment Order

1. Deploy `rag-service` first. Get its Railway internal URL.
2. Deploy `backend`. Set `RAG_SERVICE_URL` to the rag-service internal URL.
3. Deploy `frontend`. Set `VITE_API_BASE_URL` to the backend Railway public URL.
4. In Supabase: enable Realtime on `messages`, `notifications`, `cases`, `referrals` tables.
5. Run the Supabase bucket creation SQL.
6. Create the first `system_admin` user manually in Supabase Auth, then insert their `users` row with `role = 'system_admin'`.
7. Log in as system_admin, create the MoWSA institution, create the EWLA institution.
8. Log in as MoWSA institution_admin, create test case_worker accounts.

---

## API RESPONSE ENVELOPE

Every backend route must return this shape. Be consistent — the frontend depends on it.

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 156 }  // only for paginated lists
}

// Error
{
  "success": false,
  "error": {
    "code": "CASE_NOT_FOUND",      // machine-readable, SCREAMING_SNAKE_CASE
    "message": "Case not found",   // human-readable
    "details": {}                  // optional field-level errors
  }
}
```

**HTTP status codes to use:**
- `200` OK
- `201` Created (POST that creates a resource)
- `400` Bad Request (validation error)
- `401` Unauthorized (no token or invalid token)
- `403` Forbidden (valid token, wrong role)
- `404` Not Found
- `409` Conflict (e.g. duplicate)
- `500` Internal Server Error

---

## DESIGN SYSTEM RULES FOR THE IDE

These rules must be followed across ALL pages to maintain visual consistency with the Figma designs:

**Colors (CSS variables to set globally):**
```css
:root {
  --color-teal-50: #E8F5F3;
  --color-teal-100: #B2DDD8;
  --color-teal-500: #1A7A6E;
  --color-teal-700: #145F56;
  --color-teal-900: #0D3D38;
  --color-dark: #1A2332;
  --color-gray: #6B7280;
  --color-surface: #F8FAFB;
  --color-critical: #DC2626;
  --color-high: #EA580C;
  --color-medium: #D97706;
  --color-low: #6B7280;
}
```

**Typography:**
- Headings: `DM Serif Display` or `Instrument Serif` — import from Google Fonts
- Body: `DM Sans` — import from Google Fonts
- Code/case numbers: `JetBrains Mono`

**Survivor Portal feel:** Soft, warm. Background `#F8FAFB` (not pure white). Cards with very subtle shadow. Teal accents. No harsh borders.

**Dashboard feel:** Clean, professional. White cards on `#F3F4F6` background. Crisp borders. Data-dense but breathing room. Sidebar navigation fixed left.

**Do NOT:** Use generic Inter/Roboto/Arial. Use purple gradients. Make everything rounded-full. Copy the look of generic AI-generated dashboards.

---

## WHAT NOT TO BUILD (MVP SCOPE)

Skip these entirely for now:
- SMS delivery (use email OTP only for MVP — Supabase handles it)
- Mobile native app
- Video counseling
- Blockchain evidence timestamping (mentioned in docs, skip for MVP)
- Map view of local support centers (use static list)
- Full Amharic translation (add `lang` param to API, but translate UI later)
- Advanced analytics / data export

---

## SEEDING DATA FOR DEMO

After deployment, run this to have realistic demo data:

```sql
-- Create demo institutions
INSERT INTO institutions (name, type, is_active) VALUES
  ('Ministry of Women and Social Affairs', 'mowsa', true),
  ('Ethiopian Women Lawyers Association', 'ewla', true);

-- (Then create users via the API using OTP with test phone numbers)
-- Or insert directly into auth.users and users tables for demo accounts
```

Create these demo accounts manually via Supabase Auth dashboard:
- `+251900000001` → system_admin
- `+251900000002` → institution_admin (MoWSA)
- `+251900000003` → case_worker (MoWSA)
- `+251900000004` → institution_admin (EWLA)
- `+251900000005` → case_worker (EWLA)
- `+251900000006` → survivor (test)

---

## BUILD ORDER SUMMARY

```
Week 1:  DB schema in Supabase → Backend scaffold + auth → Frontend scaffold + auth → Login/verify pages
Week 2:  Case submission (backend) → Report form (frontend) → Gemini triage integration
Week 3:  Case directory + assessment pages → Status/assign endpoints → RAG service setup + ingestion
Week 4:  Referral system (backend + frontend) → Messaging + Realtime
Week 5:  Notifications (backend + Realtime frontend) → AI Legal Guide page → Evidence upload
Week 6:  Admin pages → Analytics → Polish → Demo data → Deploy all services to Railway
```
