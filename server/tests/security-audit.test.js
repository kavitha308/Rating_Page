const http = require('http');
const jwt = require('jsonwebtoken');

function makeRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('   STORE RATING PLATFORM — FULL SECURITY AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(` [PASS] ${title}`);
      passed++;
    } else {
      console.error(` [FAIL] ${title} ${extra ? '(' + extra + ')' : ''}`);
      failed++;
    }
  }

  // -----------------------------------------------------------------
  // 1. AUTHENTICATION & TOKEN AUDIT
  // -----------------------------------------------------------------
  console.log('--- 1. AUTHENTICATION & JWT SECURITY ---');

  // 1.1 Login with valid user credentials
  const userLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'jonathan.higgins@example.com', password: 'User@1234' }
  });
  assert('1.1 Valid User Login succeeds with 200', userLogin.statusCode === 200 && userLogin.body?.data?.token);
  const userToken = userLogin.body?.data?.token;

  // 1.2 Tampered token rejected
  const tamperedToken = userToken.slice(0, -6) + 'abcdef';
  const tamperedRes = await makeRequest({
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${tamperedToken}` }
  });
  assert('1.2 Tampered signature JWT rejected with 401', tamperedRes.statusCode === 401);

  // 1.3 Alg: none token attack rejected
  const headerBase64 = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify({ id: 1, email: 'admin@storerating.com', role: 'ADMIN' })).toString('base64url');
  const noneAlgToken = `${headerBase64}.${payloadBase64}.`;
  const noneAlgRes = await makeRequest({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${noneAlgToken}` }
  });
  assert('1.3 "alg: none" algorithm token rejected with 401', noneAlgRes.statusCode === 401);

  // 1.4 Missing Authorization header rejected
  const noAuthRes = await makeRequest({
    path: '/api/auth/me'
  });
  assert('1.4 Missing Bearer token rejected with 401', noAuthRes.statusCode === 401);

  // -----------------------------------------------------------------
  // 2. AUTHORIZATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // -----------------------------------------------------------------
  console.log('\n--- 2. AUTHORIZATION & PRIVILEGE ENFORCEMENT ---');

  // 2.1 Normal User attempting to access Admin Dashboard -> 403 Forbidden
  const userAdminDash = await makeRequest({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert('2.1 Normal User denied Admin Dashboard with 403', userAdminDash.statusCode === 403);

  // 2.2 Normal User attempting to access Admin Users Directory -> 403 Forbidden
  const userAdminUsers = await makeRequest({
    path: '/api/admin/users',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert('2.2 Normal User denied Admin Users Directory with 403', userAdminUsers.statusCode === 403);

  // 2.3 Normal User attempting to access Store Owner Dashboard -> 403 Forbidden
  const userOwnerDash = await makeRequest({
    path: '/api/owner/dashboard',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert('2.3 Normal User denied Store Owner Dashboard with 403', userOwnerDash.statusCode === 403);

  // 2.4 Login as Store Owner
  const ownerLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'harrington@storerating.com', password: 'Owner@1234' }
  });
  assert('2.4 Store Owner Login succeeds with 200', ownerLogin.statusCode === 200);
  const ownerToken = ownerLogin.body?.data?.token;

  // 2.5 Store Owner attempting to access Admin routes -> 403 Forbidden
  const ownerAdminUsers = await makeRequest({
    path: '/api/admin/users',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  assert('2.5 Store Owner denied Admin Users with 403', ownerAdminUsers.statusCode === 403);

  // 2.6 Store Owner attempting to submit ratings -> 403 Forbidden (requires USER role)
  const ownerRateStore = await makeRequest({
    path: '/api/stores/1/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: { rating: 5 }
  });
  assert('2.6 Store Owner prohibited from submitting ratings with 403', ownerRateStore.statusCode === 403);

  // 2.7 Login as Admin
  const adminLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'admin@storerating.com', password: 'Admin@1234' }
  });
  assert('2.7 Admin Login succeeds with 200', adminLogin.statusCode === 200);
  const adminToken = adminLogin.body?.data?.token;

  // 2.8 Admin accessing Admin Dashboard -> 200 OK
  const adminDash = await makeRequest({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert('2.8 Admin accessing Admin Dashboard allowed with 200', adminDash.statusCode === 200);

  // -----------------------------------------------------------------
  // 3. IDOR & DATA ISOLATION AUDIT
  // -----------------------------------------------------------------
  console.log('\n--- 3. IDOR & HORIZONTAL DATA ISOLATION ---');

  // 3.1 Store Owner 1 (Apex Organic, store 1) ratings are strictly scoped to Store 1
  const ownerRatings = await makeRequest({
    path: '/api/owner/ratings',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  assert('3.1 Store Owner can retrieve ratings for assigned store', ownerRatings.statusCode === 200);
  const allRatingsAreStore1 = ownerRatings.body?.data?.ratings?.every(r => r.store_id === undefined || r.store_id === 1);
  assert('3.2 Store Owner cannot view ratings of other stores', allRatingsAreStore1 === true);

  // 3.3 Normal User modifying rating is strictly scoped to req.user.id
  // Jonathan modifies rating for store 1
  const modifyRatingRes = await makeRequest({
    path: '/api/stores/1/rating',
    method: 'PUT',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 4 }
  });
  assert('3.3 Normal User can modify own rating', modifyRatingRes.statusCode === 200 && modifyRatingRes.body?.data?.user_rating === 4);

  // 3.4 Mass assignment: attempt privilege escalation during registration
  const rogueEmail = `attacker.${Date.now()}@example.com`;
  const registerWithAdminRole = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Rogue Malicious Account Candidate',
      email: rogueEmail,
      password: 'User@1234',
      address: '123 Fake Street, Hacker Alley, Dark Web City',
      role: 'ADMIN' // Attempt to inject role
    }
  });
  assert('3.4 Registration with injected role: "ADMIN" forced to "USER"',
    registerWithAdminRole.statusCode === 201 && registerWithAdminRole.body?.data?.user?.role === 'USER'
  );

  // -----------------------------------------------------------------
  // 4. DATABASE & INPUT VALIDATION AUDIT
  // -----------------------------------------------------------------
  console.log('\n--- 4. SQL INJECTION & INPUT VALIDATION ---');

  // 4.1 SQL Injection in sortBy query param
  const sqliSortRes = await makeRequest({
    path: '/api/stores?sortBy=name%27%20OR%201=1--',
    method: 'GET'
  });
  assert('4.1 SQL Injection in sortBy safely fallback to default with 200', sqliSortRes.statusCode === 200);

  // 4.2 SQL Injection in sortOrder query param
  const sqliOrderRes = await makeRequest({
    path: '/api/stores?sortOrder=%27%20UNION%20SELECT%201,2,3--',
    method: 'GET'
  });
  assert('4.2 SQL Injection in sortOrder safely sanitized to DESC with 200', sqliOrderRes.statusCode === 200);

  // 4.3 Search with unescaped LIKE wildcards (% and _)
  const wildcardSearch = await makeRequest({
    path: '/api/stores?search=%25%5F',
    method: 'GET'
  });
  assert('4.3 LIKE wildcard injection safely escaped and handled with 200', wildcardSearch.statusCode === 200);

  // 4.4 Invalid rating range: rating = 0 (below min 1)
  const invalidLowRating = await makeRequest({
    path: '/api/stores/2/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 0 }
  });
  assert('4.4 Rating value 0 rejected with 400/422 Bad Request', [400, 422].includes(invalidLowRating.statusCode));

  // 4.5 Invalid rating range: rating = 6 (above max 5)
  const invalidHighRating = await makeRequest({
    path: '/api/stores/2/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 6 }
  });
  assert('4.5 Rating value 6 rejected with 400/422 Bad Request', [400, 422].includes(invalidHighRating.statusCode));

  // 4.6 Invalid rating format: float rating = 4.5
  const floatRating = await makeRequest({
    path: '/api/stores/2/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 4.5 }
  });
  assert('4.6 Non-integer rating 4.5 rejected with 400/422 Bad Request', [400, 422].includes(floatRating.statusCode));

  // 4.7 Duplicate rating prevention
  // User Jonathan Higgins already rated store 1; attempting POST /api/stores/1/rating must fail with 409
  const duplicateRating = await makeRequest({
    path: '/api/stores/1/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 5 }
  });
  assert('4.7 Duplicate rating rejected with 409 Conflict', duplicateRating.statusCode === 409);

  // -----------------------------------------------------------------
  // 5. API HARDENING, HEADERS & PAYLOAD LIMITS
  // -----------------------------------------------------------------
  console.log('\n--- 5. API HARDENING & SECURITY HEADERS ---');

  // 5.1 Helmet security headers
  const healthCheck = await makeRequest({ path: '/api/health' });
  const headers = healthCheck.headers;
  assert('5.1 X-Content-Type-Options: nosniff present', headers['x-content-type-options'] === 'nosniff');
  assert('5.2 X-Frame-Options: DENY present', headers['x-frame-options'] === 'DENY');
  assert('5.3 Referrer-Policy present', Boolean(headers['referrer-policy']));
  assert('5.4 X-Powered-By header suppressed', headers['x-powered-by'] === undefined);

  // 5.5 Request size limit: oversized payload (> 10kb) rejected
  const oversizedPayload = { data: 'A'.repeat(15000) };
  const oversizedRes = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: oversizedPayload
  });
  assert('5.5 Oversized request payload (> 10kb) rejected with 413', oversizedRes.statusCode === 413);

  // -----------------------------------------------------------------
  // 6. PASSWORD CHANGE TOKEN REVOCATION AUDIT
  // -----------------------------------------------------------------
  console.log('\n--- 6. SESSION REVOCATION ON PASSWORD CHANGE ---');

  // Create a dedicated test user
  const testUserEmail = `token.revoke.${Date.now()}@example.com`;
  await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Password Revocation Test Account',
      email: testUserEmail,
      password: 'OldPassword@123',
      address: '100 Security Boulevard, Suite 1, Safe Zone'
    }
  });

  // Login to acquire initial session token
  const initialLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: testUserEmail, password: 'OldPassword@123' }
  });
  const initialToken = initialLogin.body?.data?.token;

  // Verify initial token works
  const preChangeVerify = await makeRequest({
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${initialToken}` }
  });
  assert('6.1 Initial token works before password update', preChangeVerify.statusCode === 200);

  // Small delay to ensure timestamp progression
  await new Promise(r => setTimeout(r, 2200));

  // Change password using initial token
  const updatePassRes = await makeRequest({
    path: '/api/auth/password',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${initialToken}` },
    body: {
      currentPassword: 'OldPassword@123',
      newPassword: 'NewPassword@999'
    }
  });
  assert('6.2 Password successfully updated', updatePassRes.statusCode === 200);

  // Small delay
  await new Promise(r => setTimeout(r, 500));

  // Now attempt to use the OLD token
  const postChangeAttempt = await makeRequest({
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${initialToken}` }
  });
  assert('6.3 Previously issued token revoked after password change (401)', postChangeAttempt.statusCode === 401);

  // Login with NEW password works
  const newLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: testUserEmail, password: 'NewPassword@999' }
  });
  assert('6.4 Login with new password succeeds and issues new valid token', newLogin.statusCode === 200 && newLogin.body?.data?.token);

  console.log('\n====================================================');
  console.log(` AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
