// Quick API test script — run with: node test-api.js
// Tests Phase 3A endpoints. You need a valid JWT token from a logged-in user.
// Get one from: browser devtools → Application → sessionStorage → supabase token

const BASE = 'http://localhost:3001/api/v1';

// ─── PASTE YOUR JWT HERE ───────────────────────────────────────
// Log in via the frontend, then open browser DevTools (F12) →
// Application → Local Storage → https://[your-supabase-url] →
// find the key containing "access_token" and paste the value below
const JWT = 'PASTE_YOUR_JWT_TOKEN_HERE';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT}`,
};

async function run() {
  console.log('\n🧪 Netsanet Phase 3A API Tests\n');

  // ── 1. Health check ─────────────────────────────────────────
  console.log('1️⃣  Health check...');
  const health = await fetch(`${BASE}/health`).then(r => r.json());
  console.log(health.success ? '   ✅ OK' : '   ❌ FAIL', health);

  // ── 2. GET /cases (list with filters) ────────────────────────
  console.log('\n2️⃣  GET /cases with filters...');
  const cases = await fetch(`${BASE}/cases?page=1&limit=5&sort_by=created_at&sort_dir=desc`, { headers }).then(r => r.json());
  console.log(cases.success ? `   ✅ OK — ${cases.data?.length} cases, total: ${cases.pagination?.total}` : `   ❌ FAIL: ${cases.error?.message}`);

  if (!cases.success || !cases.data?.length) {
    console.log('\n⚠️  No cases found. Submit a case via the frontend first, then re-run this script.\n');
    return;
  }

  const caseId = cases.data[0].id;
  const caseNumber = cases.data[0].case_number;
  console.log(`   Using case: ${caseNumber} (${caseId})`);

  // ── 3. GET /cases/:id (detail) ─────────────────────────────
  console.log('\n3️⃣  GET /cases/:id (detail)...');
  const detail = await fetch(`${BASE}/cases/${caseId}`, { headers }).then(r => r.json());
  console.log(detail.success ? `   ✅ OK — status: ${detail.data?.status}, urgency: ${detail.data?.urgency_level}` : `   ❌ FAIL: ${detail.error?.message}`);

  // ── 4. GET /cases/:id/activities ───────────────────────────
  console.log('\n4️⃣  GET /cases/:id/activities (audit trail)...');
  const activities = await fetch(`${BASE}/cases/${caseId}/activities`, { headers }).then(r => r.json());
  console.log(activities.success ? `   ✅ OK — ${activities.data?.length} activities` : `   ❌ FAIL: ${activities.error?.message}`);
  if (activities.success && activities.data?.length) {
    activities.data.slice(0, 3).forEach(a => console.log(`   • [${a.activity_type}] ${a.description} — by ${a.actor_name}`));
  }

  // ── 5. POST /cases/:id/activities (add note) ────────────────
  console.log('\n5️⃣  POST /cases/:id/activities (add note)...');
  const note = await fetch(`${BASE}/cases/${caseId}/activities`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ description: 'Test note from API test script — Phase 3A verification' }),
  }).then(r => r.json());
  console.log(note.success ? `   ✅ OK — note id: ${note.data?.id}` : `   ❌ FAIL: ${note.error?.message}`);

  // ── 6. PATCH /cases/:id/status ──────────────────────────────
  console.log('\n6️⃣  PATCH /cases/:id/status → under_review...');
  const statusUpdate = await fetch(`${BASE}/cases/${caseId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'under_review' }),
  }).then(r => r.json());
  console.log(statusUpdate.success ? `   ✅ OK — new status: ${statusUpdate.data?.status}` : `   ❌ FAIL: ${statusUpdate.error?.message}`);

  console.log('\n✨ Tests complete.\n');
}

run().catch(console.error);
