---
trigger: always_on
---

# Netsanet Project Context

This is a full-stack web platform for GBV survivor support in Ethiopia.
Always read IMPLEMENTATION_PLAN.md before making any architectural decision.

## Monorepo Structure
- backend/     → Node.js + Express + TypeScript
- frontend/    → React + Vite + TypeScript + Tailwind CSS
- rag-service/ → Cloned Python FastAPI service. DO NOT modify files inside it.

## Non-Negotiable Rules
- Database schema is defined in IMPLEMENTATION_PLAN.md. Never add or rename columns without instruction.
- Every API response must use the envelope: { success, data } or { success: false, error: { code, message } }
- rag-service/ → Cloned Python FastAPI service with pre-built ChromaDB index.
  DO NOT run ingestion_pipeline.py or pdf_processor.py — the vector DB is already populated. DO NOT modify or delete anything in rag-service/app/legal_db/.
  Only call its POST /ask endpoint from the backend.
- Never use Inter, Roboto, or Arial fonts. Use DM Serif Display + DM Sans only.
- QuickExitButton must appear on every survivor-facing page. It clears sessionStorage and redirects to google.com.
- Anonymous mode: when a case has is_anonymous=true, never show survivor name or phone in any staff-facing UI.