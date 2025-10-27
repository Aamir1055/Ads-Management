/*
  permissions_api_test.js

  A simple Node.js script to validate permissions-related endpoints.
  - Uses global fetch (Node 18+). If you're on Node < 18, upgrade Node or install `node-fetch` and uncomment the import below.

  Usage:
    # Optionally set BASE_URL and AUTH_TOKEN (JWT)
    # PowerShell:
    #   $env:BASE_URL="http://localhost:3000"; $env:AUTH_TOKEN="<your_jwt>"; node backend/permissions_api_test.js
    # cmd:
    #   set BASE_URL=http://localhost:3000 && set AUTH_TOKEN=<your_jwt> && node backend/permissions_api_test.js
    # bash:
    #   BASE_URL=http://localhost:3000 AUTH_TOKEN=<your_jwt> node backend/permissions_api_test.js
*/

// Uncomment if on Node < 18 and have node-fetch installed
// import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

function logHeader(title) {
  console.log(`\n===== ${title} =====`);
}

function headers(extra = {}) {
  const h = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (AUTH_TOKEN) h['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return h;
}

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: headers(),
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const start = Date.now();
  const res = await fetch(url, opts);
  const elapsed = Date.now() - start;
  let json = null;
  try {
    const text = await res.text();
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    // Non-JSON; keep as null
  }
  return { status: res.status, ok: res.ok, json, elapsed };
}

function countArray(v) {
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === 'object' && Array.isArray(v.data)) return v.data.length;
  return v != null ? 1 : 0;
}

async function run() {
  console.log(`Target: ${BASE_URL}`);
  console.log(`Auth: ${AUTH_TOKEN ? 'Bearer <provided>' : 'None'}`);

  // 1. Get all roles
  logHeader('1) GET /api/permissions/roles-list');
  const t1 = await request('GET', '/api/permissions/roles-list');
  console.log(`Status: ${t1.status} (${t1.elapsed}ms)`);
  console.log(`Roles count: ${countArray(t1.json)}`);

  // 2. Get all modules
  logHeader('2) GET /api/permissions/modules');
  const t2 = await request('GET', '/api/permissions/modules');
  console.log(`Status: ${t2.status} (${t2.elapsed}ms)`);
  console.log(`Modules count: ${countArray(t2.json)}`);

  // 3. Get permissions for user ID 1
  logHeader('3) GET /api/permissions/user/1');
  const t3 = await request('GET', '/api/permissions/user/1');
  console.log(`Status: ${t3.status} (${t3.elapsed}ms)`);
  console.log(`Permissions (user 1) count: ${countArray(t3.json)}`);

  // 4. Get roles for user ID 1
  logHeader('4) GET /api/permissions/user/1/roles');
  const t4 = await request('GET', '/api/permissions/user/1/roles');
  console.log(`Status: ${t4.status} (${t4.elapsed}ms)`);
  console.log(`User 1 roles count: ${countArray(t4.json)}`);

  // 5. Check if user ID 1 has users.create permission
  logHeader('5) POST /api/permissions/check');
  const t5 = await request('POST', '/api/permissions/check', {
    userId: 1,
    permission: 'users.create',
  });
  console.log(`Status: ${t5.status} (${t5.elapsed}ms)`);
  console.log('Check response:', t5.json);

  // 6. Get permissions for role ID 1
  logHeader('6) GET /api/permissions/role/1/permissions');
  const t6 = await request('GET', '/api/permissions/role/1/permissions');
  console.log(`Status: ${t6.status} (${t6.elapsed}ms)`);
  console.log(`Role 1 permissions count: ${countArray(t6.json)}`);

  // Summary
  logHeader('SUMMARY');
  const results = [t1, t2, t3, t4, t5, t6];
  const pass = results.filter(r => r.ok).length;
  console.log(`Passed: ${pass}/${results.length}`);

  // Helpful diagnostics on failures
  results.forEach((r, i) => {
    if (!r.ok) {
      console.log(`\n-- Failure Detail [Step ${i + 1}] --`);
      console.log('Status:', r.status);
      console.log('Body:', r.json);
    }
  });
}

run().catch(err => {
  console.error('Unexpected error running tests:', err);
  process.exit(1);
});

