---
description: Add Frontend Page Workflow
---

When adding a new React page:
1. Create the page component in the correct folder (survivor/ or dashboard/)
2. Add the route to App.tsx wrapped in ProtectedRoute with correct roles
3. Use TanStack Query for any data fetching
4. Import QuickExitButton if this is a survivor-facing page
5. Match the design rules in .agent/rules/ui-design.md
6. Show a loading skeleton while data fetches — never a blank screen