const http = require('http');

function makeRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-suite',
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

async function runFullQASuite() {
  console.log('================================================================');
  console.log('       STORE RATING PLATFORM — FULL END-TO-END QA SUITE         ');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  const failedTestsList = [];

  function check(title, condition, extra = '') {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${title} ${extra ? '(' + extra + ')' : ''}`);
      failedTestsList.push({ title, extra });
    }
  }

  // =================================================================
  // SECTION 1: AUTHENTICATION & SESSION MANAGEMENT
  // =================================================================
  console.log('--- 1. AUTHENTICATION & ROLE SESSIONS ---');

  // 1.1 Admin Login
  const adminLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'admin@storerating.com', password: 'Admin@1234' }
  });
  check('1.1 Admin login returns 200 with JWT', adminLogin.statusCode === 200 && adminLogin.body?.data?.token);
  check('1.2 Admin role is strictly ADMIN', adminLogin.body?.data?.user?.role === 'ADMIN');
  const adminToken = adminLogin.body?.data?.token;

  // 1.3 Normal User Login
  const userLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'jonathan.higgins@example.com', password: 'User@1234' }
  });
  check('1.3 Normal User login returns 200 with JWT', userLogin.statusCode === 200 && userLogin.body?.data?.token);
  check('1.4 Normal User role is strictly USER', userLogin.body?.data?.user?.role === 'USER');
  const userToken = userLogin.body?.data?.token;

  // 1.5 Store Owner Login
  const ownerLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'harrington@storerating.com', password: 'Owner@1234' }
  });
  check('1.5 Store Owner login returns 200 with JWT', ownerLogin.statusCode === 200 && ownerLogin.body?.data?.token);
  check('1.6 Store Owner role is strictly STORE_OWNER', ownerLogin.body?.data?.user?.role === 'STORE_OWNER');
  const ownerToken = ownerLogin.body?.data?.token;

  // 1.7 Current User Profile /me
  const meRes = await makeRequest({
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('1.7 GET /api/auth/me returns current session user', meRes.statusCode === 200 && meRes.body?.data?.user?.email === 'jonathan.higgins@example.com');
  check('1.8 GET /api/auth/me does NOT expose password_hash', meRes.body?.data?.user?.password_hash === undefined);

  // 1.9 Valid User Registration
  const testRegEmail = `qa.user.${Date.now()}@example.com`;
  const registerRes = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Regina Victoria Sterlingworth',
      email: testRegEmail,
      address: '888 High Mountain Boulevard, Upper Crest, River Valley',
      password: 'User@1234'
    }
  });
  check('1.9 Registration of new user returns 201 Created', registerRes.statusCode === 201 && registerRes.body?.data?.user);
  check('1.10 Registration forces role to USER', registerRes.body?.data?.user?.role === 'USER');

  // 1.11 Newly registered user login
  const newLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: testRegEmail, password: 'User@1234' }
  });
  check('1.11 Login with newly registered user succeeds (200)', newLogin.statusCode === 200 && newLogin.body?.data?.token);
  const newRegToken = newLogin.body?.data?.token;

  // 1.12 Password Change flow
  const changePassRes = await makeRequest({
    path: '/api/auth/password',
    method: 'PATCH',
    headers: { Authorization: `Bearer ${newRegToken}` },
    body: {
      currentPassword: 'User@1234',
      newPassword: 'NewPassword@999'
    }
  });
  check('1.12 PATCH /api/auth/password updates password with 200', changePassRes.statusCode === 200);

  // 1.13 Old password rejected after change
  const oldLoginFail = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: testRegEmail, password: 'User@1234' }
  });
  check('1.13 Login with old password rejected with 401', oldLoginFail.statusCode === 401);

  // 1.14 New password login succeeds
  const newPassLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: testRegEmail, password: 'NewPassword@999' }
  });
  check('1.14 Login with new password succeeds with 200', newPassLogin.statusCode === 200);

  // =================================================================
  // SECTION 2: INPUT VALIDATION BOUNDARY TESTS
  // =================================================================
  console.log('\n--- 2. INPUT VALIDATION BOUNDARY TESTS ---');

  // 2.1 Name below 20 characters (19 chars)
  const nameShort = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'A'.repeat(19),
      email: `valid.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'User@1234'
    }
  });
  check('2.1 Name below 20 chars rejected with 422', nameShort.statusCode === 422);

  // 2.2 Name above 60 characters (61 chars)
  const nameLong = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'A'.repeat(61),
      email: `valid.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'User@1234'
    }
  });
  check('2.2 Name above 60 chars rejected with 422', nameLong.statusCode === 422);

  // 2.3 Name valid boundaries (20 chars and 60 chars)
  const name20 = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'A'.repeat(20),
      email: `name20.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'User@1234'
    }
  });
  check('2.3 Exact 20-character Name accepted with 201', name20.statusCode === 201);

  const name60 = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'A'.repeat(60),
      email: `name60.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'User@1234'
    }
  });
  check('2.4 Exact 60-character Name accepted with 201', name60.statusCode === 201);

  // 2.5 Address above 400 characters (401 chars)
  const addressLong = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: `addresslong.${Date.now()}@example.com`,
      address: 'A'.repeat(401),
      password: 'User@1234'
    }
  });
  check('2.5 Address above 400 chars rejected with 422', addressLong.statusCode === 422);

  // 2.6 Address exact 400 characters accepted
  const address400 = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: `address400.${Date.now()}@example.com`,
      address: 'A'.repeat(400),
      password: 'User@1234'
    }
  });
  check('2.6 Exact 400-character Address accepted with 201', address400.statusCode === 201);

  // 2.7 Invalid Email formats
  const invalidEmail1 = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: 'not-an-email',
      address: '123 Valid Road, City Center',
      password: 'User@1234'
    }
  });
  check('2.7 Invalid email "not-an-email" rejected with 422', invalidEmail1.statusCode === 422);

  const invalidEmail2 = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: 'user@',
      address: '123 Valid Road, City Center',
      password: 'User@1234'
    }
  });
  check('2.8 Invalid email "user@" rejected with 422', invalidEmail2.statusCode === 422);

  // 2.9 Password below 8 characters (7 chars)
  const passShort = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: `passshort.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'Pass@12'
    }
  });
  check('2.9 Password below 8 chars (7) rejected with 422', passShort.statusCode === 422);

  // 2.10 Password above 16 characters (17 chars)
  const passLong = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: `passlong.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'Password@12345678'
    }
  });
  check('2.10 Password above 16 chars (17) rejected with 422', passLong.statusCode === 422);

  // 2.11 Password without uppercase letter
  const passNoUpper = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: `passnoupper.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'password@123'
    }
  });
  check('2.11 Password without uppercase rejected with 422', passNoUpper.statusCode === 422);

  // 2.12 Password without special character
  const passNoSpecial = await makeRequest({
    path: '/api/auth/register',
    method: 'POST',
    body: {
      name: 'Valid Name Exactly 25 Chars',
      email: `passnospec.${Date.now()}@example.com`,
      address: '123 Valid Road, City Center',
      password: 'Password1234'
    }
  });
  check('2.12 Password without special char rejected with 422', passNoSpecial.statusCode === 422);

  // 2.13 Rating below 1 (0 and -1)
  const ratingZero = await makeRequest({
    path: '/api/stores/3/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 0 }
  });
  check('2.13 Rating below 1 (0) rejected with 400/422', [400, 422].includes(ratingZero.statusCode));

  const ratingNeg = await makeRequest({
    path: '/api/stores/3/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: -1 }
  });
  check('2.14 Negative rating (-1) rejected with 400/422', [400, 422].includes(ratingNeg.statusCode));

  // 2.15 Rating above 5 (6 and 100)
  const ratingSix = await makeRequest({
    path: '/api/stores/3/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 6 }
  });
  check('2.15 Rating above 5 (6) rejected with 400/422', [400, 422].includes(ratingSix.statusCode));

  const ratingHundred = await makeRequest({
    path: '/api/stores/3/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 100 }
  });
  check('2.16 Rating above 5 (100) rejected with 400/422', [400, 422].includes(ratingHundred.statusCode));

  // =================================================================
  // SECTION 3: ROLE-BASED AUTHORIZATION & SECURITY
  // =================================================================
  console.log('\n--- 3. ROLE-BASED AUTHORIZATION & SECURITY ---');

  // 3.1 Normal User denied Admin endpoints
  const userToAdmin = await makeRequest({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.1 Normal User denied GET /api/admin/dashboard with 403', userToAdmin.statusCode === 403);

  const userToAdminUsers = await makeRequest({
    path: '/api/admin/users',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.2 Normal User denied GET /api/admin/users with 403', userToAdminUsers.statusCode === 403);

  const userToAdminStores = await makeRequest({
    path: '/api/admin/stores',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.3 Normal User denied GET /api/admin/stores with 403', userToAdminStores.statusCode === 403);

  // 3.4 Store Owner denied Admin endpoints
  const ownerToAdmin = await makeRequest({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  check('3.4 Store Owner denied GET /api/admin/dashboard with 403', ownerToAdmin.statusCode === 403);

  const ownerToAdminUsers = await makeRequest({
    path: '/api/admin/users',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  check('3.5 Store Owner denied GET /api/admin/users with 403', ownerToAdminUsers.statusCode === 403);

  // 3.6 Normal User denied Store Owner endpoints
  const userToOwner = await makeRequest({
    path: '/api/owner/dashboard',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.6 Normal User denied GET /api/owner/dashboard with 403', userToOwner.statusCode === 403);

  // 3.7 Store Owner denied rating submission
  const ownerRateAttempt = await makeRequest({
    path: '/api/stores/1/rating',
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: { rating: 5 }
  });
  check('3.7 Store Owner denied rating store with 403 Forbidden', ownerRateAttempt.statusCode === 403);

  // 3.8 Unauthenticated request to protected endpoints
  const unauthMe = await makeRequest({ path: '/api/auth/me' });
  check('3.8 Unauthenticated /api/auth/me rejected with 401', unauthMe.statusCode === 401);

  const unauthStoresRating = await makeRequest({
    path: '/api/stores/1/rating',
    method: 'POST',
    body: { rating: 5 }
  });
  check('3.9 Unauthenticated rating submission rejected with 401', unauthStoresRating.statusCode === 401);

  // 3.10 IDOR & Cross-store isolation
  const ownerRatingsRes = await makeRequest({
    path: '/api/owner/ratings',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  check('3.10 Store owner ratings are strictly scoped to own store', ownerRatingsRes.statusCode === 200);
  const foreignStoreRatings = ownerRatingsRes.body?.data?.ratings?.filter(r => r.store_id && r.store_id !== 1);
  check('3.11 Store owner cannot see ratings belonging to another store', (foreignStoreRatings || []).length === 0);

  // 3.12 SQL Injection in sortBy query parameter
  const sqliSort = await makeRequest({
    path: '/api/stores?sortBy=name%27%20OR%201=1--',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.12 SQL Injection in sortBy safely fallback to default (200)', sqliSort.statusCode === 200);

  // 3.13 SQL Injection in sortOrder
  const sqliOrder = await makeRequest({
    path: '/api/stores?sortOrder=%27;%20DROP%20TABLE%20users;--',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.13 SQL Injection in sortOrder safely constrained (200)', sqliOrder.statusCode === 200);

  // 3.14 Invalid ID parameters
  const invalidIdParam = await makeRequest({
    path: '/api/stores/abc',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.14 Non-numeric store ID rejected with 400/422', [400, 422].includes(invalidIdParam.statusCode));

  const nonExistentStore = await makeRequest({
    path: '/api/stores/999999',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('3.15 Non-existent store ID returns 404 Not Found', nonExistentStore.statusCode === 404);

  // =================================================================
  // SECTION 4: ADMIN INTERFACE APIS
  // =================================================================
  console.log('\n--- 4. ADMIN INTERFACE & MANAGEMENT ---');

  // 4.1 Admin Dashboard metrics
  const adminDash = await makeRequest({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('4.1 GET /api/admin/dashboard returns 200', adminDash.statusCode === 200);
  check('4.2 Dashboard contains users total and breakdown', typeof adminDash.body?.data?.users?.total === 'number');
  check('4.3 Dashboard contains stores total and assigned count', typeof adminDash.body?.data?.stores?.total === 'number');
  check('4.4 Dashboard contains ratings total and average', typeof adminDash.body?.data?.ratings?.total === 'number');

  // 4.2 User Management: List, Search, Filter, Sort, Paginate
  const listUsers = await makeRequest({
    path: '/api/admin/users?page=1&limit=5',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('4.5 GET /api/admin/users returns paginated user list (200)', listUsers.statusCode === 200 && Array.isArray(listUsers.body?.data?.users));
  check('4.6 User pagination meta total and totalPages present', typeof listUsers.body?.meta?.pagination?.total === 'number');

  // Filter by role
  const filterOwners = await makeRequest({
    path: '/api/admin/users?role=STORE_OWNER',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const allAreOwners = filterOwners.body?.data?.users?.every(u => u.role === 'STORE_OWNER');
  check('4.7 Filter users by role=STORE_OWNER returns only STORE_OWNER accounts', filterOwners.statusCode === 200 && allAreOwners === true);

  // Store owners show store name and average rating
  const ownerWithStore = filterOwners.body?.data?.users?.find(u => u.store_name);
  check('4.8 Store owner user record displays store name and store rating', Boolean(ownerWithStore?.store_name));

  // Search users by name
  const searchUser = await makeRequest({
    path: '/api/admin/users?search=Jonathan',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('4.9 Search users by name "Jonathan" finds matching account', searchUser.statusCode === 200 && searchUser.body?.data?.users?.length >= 1);

  // Sort users by name ASC
  const sortUsersName = await makeRequest({
    path: '/api/admin/users?sortBy=name&sortOrder=ASC',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('4.10 Sort users by name ASC returns 200', sortUsersName.statusCode === 200);

  // Admin View Single User details
  const viewUserDetail = await makeRequest({
    path: '/api/admin/users/2',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('4.11 GET /api/admin/users/:id returns user details (200)', viewUserDetail.statusCode === 200 && viewUserDetail.body?.data?.user?.id === 2);
  check('4.12 Store owner user details includes their store and average rating', Boolean(viewUserDetail.body?.data?.user?.store?.name));

  // Admin Create New User (e.g. STORE_OWNER)
  const newOwnerEmail = `qa.new.owner.${Date.now()}@storerating.com`;
  const createOwnerRes = await makeRequest({
    path: '/api/admin/users',
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: 'Alexander Maximilian Sterling',
      email: newOwnerEmail,
      address: '777 Sovereign Plaza, Suite 400, Financial District',
      password: 'Owner@1234',
      role: 'STORE_OWNER'
    }
  });
  check('4.13 Admin POST /api/admin/users creates new STORE_OWNER (201)', createOwnerRes.statusCode === 201 && createOwnerRes.body?.data?.user?.role === 'STORE_OWNER');
  const createdOwnerId = createOwnerRes.body?.data?.user?.id;

  // Admin Store Management: List, Search, Sort, Paginate
  const listStores = await makeRequest({
    path: '/api/admin/stores?page=1&limit=5',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('4.14 GET /api/admin/stores returns paginated store list (200)', listStores.statusCode === 200 && Array.isArray(listStores.body?.data?.stores));

  // Search stores by name
  const searchStore = await makeRequest({
    path: '/api/admin/stores?search=Organic',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('4.15 Search stores by name "Organic" finds Apex Organic (200)', searchStore.statusCode === 200 && searchStore.body?.data?.stores?.some(s => s.name.includes('Organic')));

  // Admin Create Store with Assigned Owner
  const createStoreRes = await makeRequest({
    path: '/api/admin/stores',
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: 'Sterling Artisan Leather Goods',
      email: `contact.${Date.now()}@sterlingleather.com`,
      address: '777 Sovereign Plaza, Suite 400, Financial District',
      ownerId: createdOwnerId
    }
  });
  check('4.16 Admin POST /api/admin/stores creates new store with assigned owner (201)', createStoreRes.statusCode === 201 && createStoreRes.body?.data?.store);
  const createdStoreId = createStoreRes.body?.data?.store?.id;

  // Attempt to assign an already-assigned store owner fails with 409
  const reassignAttempt = await makeRequest({
    path: '/api/admin/stores',
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: 'Second Store With Same Owner',
      email: `contact2.${Date.now()}@example.com`,
      address: '888 Sovereign Plaza, Suite 400, Financial District',
      ownerId: createdOwnerId
    }
  });
  check('4.17 Assigning already-assigned store owner rejected with 409 Conflict', reassignAttempt.statusCode === 409);

  // =================================================================
  // SECTION 5: NORMAL USER CATALOG & RATING LIFECYCLE
  // =================================================================
  console.log('\n--- 5. NORMAL USER EXPERIENCE & RATING LIFECYCLE ---');

  // 5.1 Browse Stores
  const browseStores = await makeRequest({
    path: '/api/stores?page=1&limit=10',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('5.1 GET /api/stores returns catalog with overall_rating and user_submitted_rating', browseStores.statusCode === 200 && Array.isArray(browseStores.body?.data?.stores));

  // 5.2 Search stores by name or address
  const userSearchStore = await makeRequest({
    path: '/api/stores?search=Coffee',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('5.2 Normal user search by "Coffee" returns matching stores', userSearchStore.statusCode === 200 && userSearchStore.body?.data?.stores?.some(s => s.name.includes('Coffee')));

  // 5.3 Sort stores by rating DESC
  const userSortRating = await makeRequest({
    path: '/api/stores?sortBy=rating&sortOrder=DESC',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('5.3 Sort stores by rating DESC returns 200', userSortRating.statusCode === 200);

  // 5.4 Submit initial rating for newly created store (Store created by Admin)
  const submitRatingRes = await makeRequest({
    path: `/api/stores/${createdStoreId}/rating`,
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 5 }
  });
  check('5.4 Submit rating (5) for unrated store returns 201 Created', submitRatingRes.statusCode === 201 && submitRatingRes.body?.data?.user_rating === 5);
  check('5.5 Store overall_rating reflects submitted rating (5.0)', submitRatingRes.body?.data?.overall_rating === 5);

  // 5.6 Duplicate rating prevention via POST
  const duplicatePost = await makeRequest({
    path: `/api/stores/${createdStoreId}/rating`,
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 4 }
  });
  check('5.6 Duplicate rating submission via POST rejected with 409 Conflict', duplicatePost.statusCode === 409);

  // 5.7 Modify existing rating via PUT
  const modifyRatingRes = await makeRequest({
    path: `/api/stores/${createdStoreId}/rating`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { rating: 3 }
  });
  check('5.7 Modify rating (3) via PUT returns 200 OK', modifyRatingRes.statusCode === 200 && modifyRatingRes.body?.data?.user_rating === 3);
  check('5.8 Overall rating recalculated to 3.0', modifyRatingRes.body?.data?.overall_rating === 3);

  // 5.9 Second user rates the same store to verify average calculation
  const secondUserLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'bart.davis@example.com', password: 'User@1234' }
  });
  const secondUserToken = secondUserLogin.body?.data?.token;

  const secondRatingRes = await makeRequest({
    path: `/api/stores/${createdStoreId}/rating`,
    method: 'POST',
    headers: { Authorization: `Bearer ${secondUserToken}` },
    body: { rating: 5 }
  });
  check('5.9 Second user rates store (5 stars) successfully', secondRatingRes.statusCode === 201);
  // Average of 3 and 5 should be exactly 4.0
  check('5.10 Mathematical average calculation: (3 + 5) / 2 = 4.0', secondRatingRes.body?.data?.overall_rating === 4 && secondRatingRes.body?.data?.total_ratings === 2);

  // =================================================================
  // SECTION 6: STORE OWNER DASHBOARD
  // =================================================================
  console.log('\n--- 6. STORE OWNER DASHBOARD & METRICS ---');

  // Log in as the owner of the newly rated store
  const newOwnerLogin = await makeRequest({
    path: '/api/auth/login',
    method: 'POST',
    body: { email: newOwnerEmail, password: 'Owner@1234' }
  });
  const newOwnerSessionToken = newOwnerLogin.body?.data?.token;

  const ownerDashRes = await makeRequest({
    path: '/api/owner/dashboard',
    headers: { Authorization: `Bearer ${newOwnerSessionToken}` }
  });
  check('6.1 GET /api/owner/dashboard returns merchant metrics (200)', ownerDashRes.statusCode === 200 && ownerDashRes.body?.data?.hasAssignedStore === true);
  check('6.2 Dashboard displays store profile (name, email, address)', Boolean(ownerDashRes.body?.data?.store?.name));
  check('6.3 Dashboard displays accurate average rating (4.0)', ownerDashRes.body?.data?.metrics?.average_rating === 4);
  check('6.4 Dashboard displays accurate total ratings count (2)', ownerDashRes.body?.data?.metrics?.total_ratings === 2);
  check('6.5 Dashboard displays 5-star distribution breakdown', typeof ownerDashRes.body?.data?.metrics?.rating_distribution[5] === 'number');

  // View ratings table for store owner
  const ownerRatingsTable = await makeRequest({
    path: '/api/owner/ratings',
    headers: { Authorization: `Bearer ${newOwnerSessionToken}` }
  });
  check('6.6 GET /api/owner/ratings returns customer review records (200)', ownerRatingsTable.statusCode === 200 && ownerRatingsTable.body?.data?.ratings?.length === 2);
  const raters = ownerRatingsTable.body?.data?.ratings || [];
  const firstRater = raters[0] || {};
  check('6.7 Ratings table includes user_name, user_email, rating, created_at', Boolean(firstRater.user_name && firstRater.user_email && firstRater.rating && firstRater.created_at));
  check('6.8 Ratings table does NOT expose customer home address or password', firstRater.user_address === undefined && firstRater.password_hash === undefined);

  // Sort ratings by rating ASC
  const ownerSortRatings = await makeRequest({
    path: '/api/owner/ratings?sortBy=rating&sortOrder=ASC',
    headers: { Authorization: `Bearer ${newOwnerSessionToken}` }
  });
  check('6.9 Store owner sort ratings by rating ASC returns 200', ownerSortRatings.statusCode === 200);

  // Search ratings by customer name
  const ownerSearchRater = await makeRequest({
    path: '/api/owner/ratings?search=Jonathan',
    headers: { Authorization: `Bearer ${newOwnerSessionToken}` }
  });
  check('6.10 Store owner filter ratings by customer name returns matching rater', ownerSearchRater.statusCode === 200 && ownerSearchRater.body?.data?.ratings?.length === 1);

  // =================================================================
  // FINAL SCORE & RESULTS
  // =================================================================
  console.log('\n================================================================');
  console.log(` QA SUITE COMPLETE: ${passedTests} PASSED out of ${totalTests} TOTAL TESTS`);
  console.log(` SUCCESS RATE: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failedTestsList.length > 0) {
    console.error('FAILED TESTS:');
    failedTestsList.forEach(f => console.error(`  - ${f.title}: ${f.extra}`));
    process.exit(1);
  }
}

runFullQASuite().catch(err => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
