---
description: Add API Route Workflow
---

When adding a new Express route:
1. Create the route handler in backend/src/routes/[resource].ts
2. Add input validation using express-validator
3. Add the requireRole middleware with correct roles from IMPLEMENTATION_PLAN.md
4. Return responses using the standard envelope format
5. Register the route in backend/src/index.ts
6. List the curl command I can use to test it