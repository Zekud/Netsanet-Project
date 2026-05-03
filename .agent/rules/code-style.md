---
trigger: always_on
---

# Code Style Rules

## Backend (TypeScript)
- Use async/await, never raw Promise chains
- All route handlers must be wrapped in try/catch
- Use express-validator for request validation before any DB call
- All Supabase calls use the service-role client (lib/supabase.ts), never the anon client
- Log errors with console.error(error) before returning 500 responses

## Frontend (React + TypeScript)
- Use TanStack Query for all data fetching. No useEffect + fetch combos.
- All forms use React Hook Form
- Loading states must always be handled — never leave UI blank while fetching
- Every page that is survivor-facing must import and render QuickExitButton
- Use Tailwind utility classes only — no inline styles, no CSS modules

## General
- Never hardcode secrets, URLs, or API keys — always use environment variables
- Every new file needs a short comment at the top explaining what it does