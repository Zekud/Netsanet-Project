# Netsanet

A B2B2C web platform for Gender-Based Violence (GBV) survivor support in Ethiopia.

It has two portals:
- **Survivor Portal** — survivors report incidents, track cases, chat with an AI Legal Guide, upload evidence, and message their case manager.
- **Institution Dashboard** — case management system for MoWSA (intake), EWLA (legal aid), and a System Admin. Cases flow via a referral system.

---

## Monorepo Structure

```
netsanet/
├── backend/        ← Node.js + Express + TypeScript API
├── frontend/       ← React + Vite + TypeScript + Tailwind CSS
└── rag-service/    ← Python FastAPI RAG service (Ethiopian legal docs)
```

---

## Prerequisites

Make sure you have the following installed globally:

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Comes with Node.js |
| Python | 3.10+ | https://python.org |
| pip | latest | Comes with Python |

---

## 1. Clone the Repository

```bash
git clone <your-repo-url> netsanet
cd netsanet
```

---

## 2. Environment Variables

Each service needs its own `.env` file. **Never commit `.env` files.**  
Ask the project owner for the actual values.

### `backend/.env`

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
RAG_SERVICE_URL=http://localhost:8000
JWT_SECRET=your-supabase-jwt-secret
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Get Supabase keys from: **Supabase Dashboard → Project Settings → API**  
> Get Gemini key from: **https://aistudio.google.com/app/apikey**

---

## 3. Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

### RAG Service (Python — requires virtual environment)

```bash
cd rag-service

# Create virtual environment
python -m venv venv

# Activate it:
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## 4. Run All Services

Open **three separate terminals**, one per service.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Runs on: `http://localhost:3001`  
Health check: `http://localhost:3001/api/v1/health`

---

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Runs on: `http://localhost:5173`

---

### Terminal 3 — RAG Service

```bash
cd rag-service

# Activate venv first (every new terminal session):
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

uvicorn app.main:app --reload --port 8000
```

Runs on: `http://localhost:8000`

> **Note:** Do **not** delete or move anything inside `rag-service/app/legal_db/` — this is the pre-built ChromaDB vector index for Ethiopian legal documents.

---

## 5. User Roles

The database and admin accounts are already set up. Ask the project owner for your login email.

| Role | Portal | Access |
|---|---|---|
| `survivor` | `/safe-space` | Report cases, chat with AI, upload evidence |
| `case_worker` | `/dashboard` | Manage assigned cases, message survivors |
| `institution_admin` | `/dashboard` | Manage staff, view all institution cases, refer cases |
| `system_admin` | `/dashboard` | Manage institutions, platform-wide view |

**Login flow:** Go to `/login` → enter your email → check your inbox for the OTP/magic link.

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State / Data fetching | TanStack Query v5 |
| Routing | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| Database + Auth + Storage | Supabase |
| Realtime | Supabase Realtime |
| AI Classification | Google Gemini 1.5 Flash |
| RAG Chat | FastAPI + ChromaDB (Ethiopian legal PDFs) |

---

## Common Issues

### OTP email not arriving
Check your spam folder. If still missing, ask the project owner to check **Supabase → Authentication → Logs**.

### RAG service returns no results
Make sure `rag-service/app/legal_db/` exists and was not deleted. Do **not** run any ingestion or PDF processing scripts — the index is pre-built.

### `venv` not found when starting RAG service
You need to create it once per machine:
```bash
cd rag-service
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### Frontend shows blank dashboard / wrong redirect after login
Log out and log in again — the role context needs a fresh token after any backend role change.
