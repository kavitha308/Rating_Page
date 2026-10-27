process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

// Color helpers for clean terminal output
const green = (msg) => `\x1b[32mPASS\x1b[0m ${msg}`;
const red = (msg) => `\x1b[31mFAIL\x1b[0m ${msg}`;
const cyan = (msg) => `\x1b[36m${msg}\x1b[0m`;

let passed = 0;
let failed = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(green(description));
    passed++;
  } else {
    console.error(red(description));
    failed++;
  }
};

const runTests = async () => {
  console.log(cyan('\n======================================================'));
  console.log(cyan('  STORE RATING PLATFORM — COMPREHENSIVE API TEST SUITE'));
  console.log(cyan('======================================================\n'));

  let adminToken = '';
  let ownerToken = '';
  let userToken = '';
  let newlyRegisteredToken = '';
  let createdOwnerId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. HEALTH CHECK
    // -------------------------------------------------------------------------
    console.log(cyan('--- Testing Platform Health ---'));
    const healthRes = await request(app).get('/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 Healthy');
    assert(healthRes.body.status === 'healthy', 'Health check body status is healthy');

    // -------------------------------------------------------------------------
    // 2. AUTHENTICATION & VALIDATION TESTS
    // -------------------------------------------------------------------------
    console.log(cyan('\n--- Testing Authentication & Input Validation ---'));

    // Test A: Name < 20 characters rejected
    const shortNameRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Name',
        email: 'short.name@example.com',
        password: 'Password@123',
        address: '123 Test Street, Springfield'
      });
    assert(shortNameRes.status === 422, 'POST /api/auth/register rejects Name < 20 chars (422)');

    // Test B: Password without special character rejected
    const weakPassRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Valid Name Minimum Characters Here',
        email: 'weak.pass@example.com',
        password: 'Password123', // No special char
        address: '123 Test Street, Springfield'
      });
    assert(weakPassRes.status === 422, 'POST /api/auth/register rejects password lacking special char (422)');

    // Test C: Valid registration
    const validRegisterRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Gwendolyn Charlotte Richardson',
        email: 'gwendolyn.richardson@example.com',
        password: 'UserPass@2026',
        address: '450 University Boulevard, Suite 8A, West End, Greenfield'
      });
    assert(validRegisterRes.status === 201, 'POST /api/auth/register succeeds with valid payload (201)');
    assert(validRegisterRes.body.data.user.role === 'USER', 'Registration strictly assigns role = "USER"');
    assert(!validRegisterRes.body.data.user.password_hash, 'Password hash is NOT exposed in response');

    // Test D: Duplicate registration rejected
    const dupRegisterRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Gwendolyn Charlotte Richardson',
        email: 'gwendolyn.richardson@example.com',
        password: 'UserPass@2026',
        address: '450 University Boulevard, Suite 8A, West End, Greenfield'
      });
    assert(dupRegisterRes.status === 409, 'POST /api/auth/register rejects duplicate email (409)');

    // Test E: Invalid login credentials
    const badLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@storerating.com',
        password: 'WrongPassword@123'
      });
    assert(badLoginRes.status === 401, 'POST /api/auth/login rejects incorrect password (401)');

    // Test F: Admin login
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@storerating.com',
        password: 'Admin@1234'
      });
    assert(adminLoginRes.status === 200, 'POST /api/auth/login authenticates Admin (200)');
    assert(adminLoginRes.body.data.user.role === 'ADMIN', 'Admin user has role ADMIN');
    adminToken = adminLoginRes.body.data.token;

    // Test G: Store Owner login
    const ownerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'harrington@storerating.com',
        password: 'Owner@1234'
      });
    assert(ownerLoginRes.status === 200, 'POST /api/auth/login authenticates Store Owner (200)');
    assert(ownerLoginRes.body.data.user.role === 'STORE_OWNER', 'Owner user has role STORE_OWNER');
    ownerToken = ownerLoginRes.body.data.token;

    // Test H: Normal User login
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jonathan.higgins@example.com',
        password: 'User@1234'
      });
    assert(userLoginRes.status === 200, 'POST /api/auth/login authenticates Normal User (200)');
    assert(userLoginRes.body.data.user.role === 'USER', 'Normal user has role USER');
    userToken = userLoginRes.body.data.token;

    // Test I: Newly registered user login
    const newUserLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'gwendolyn.richardson@example.com',
        password: 'UserPass@2026'
      });
    assert(newUserLoginRes.status === 200, 'Newly registered user can log in (200)');
    newlyRegisteredToken = newUserLoginRes.body.data.token;

    // Test J: GET /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    assert(meRes.status === 200, 'GET /api/auth/me returns current user profile (200)');
    assert(meRes.body.data.user.email === 'jonathan.higgins@example.com', 'Me endpoint matches session user');

    // Test K: Update password
    const changePassRes = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${newlyRegisteredToken}`)
      .send({
        currentPassword: 'UserPass@2026',
        newPassword: 'BrandNewPass@99'
      });
    assert(changePassRes.status === 200, 'PATCH /api/auth/password updates password successfully (200)');

    // -------------------------------------------------------------------------
    // 3. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
    // -------------------------------------------------------------------------
    console.log(cyan('\n--- Testing Role-Based Access Control (RBAC) ---'));

    // Test A: Unauthenticated request to protected route
    const noAuthRes = await request(app).get('/api/admin/dashboard');
    assert(noAuthRes.status === 401, 'Unauthenticated request to Admin endpoint returns 401');

    // Test B: Normal User accessing Admin route
    const userToAdminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    assert(userToAdminRes.status === 403, 'Normal user accessing Admin endpoint returns 403 Forbidden');

    // Test C: Store Owner accessing Admin route
    const ownerToAdminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(ownerToAdminRes.status === 403, 'Store owner accessing Admin endpoint returns 403 Forbidden');

    // Test D: Normal User accessing Store Owner route
    const userToOwnerRes = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    assert(userToOwnerRes.status === 403, 'Normal user accessing Owner endpoint returns 403 Forbidden');

    // -------------------------------------------------------------------------
    // 4. USER STORES & RATING APIS
    // -------------------------------------------------------------------------
    console.log(cyan('\n--- Testing Stores Catalog & Rating Submissions ---'));

    // Test A: Browse stores list (public/optional auth)
    const storesRes = await request(app)
      .get('/api/stores')
      .set('Authorization', `Bearer ${userToken}`);
    assert(storesRes.status === 200, 'GET /api/stores returns store catalog (200)');
    assert(Array.isArray(storesRes.body.data.stores), 'Stores data is an array');
    assert(storesRes.body.meta.pagination.total > 0, 'Pagination meta total is accurate');

    // Test B: Search stores by keyword
    const searchRes = await request(app).get('/api/stores?search=Organic');
    assert(searchRes.status === 200, 'GET /api/stores?search=Organic returns 200');
    assert(searchRes.body.data.stores.some((s) => s.name.includes('Organic')), 'Search results filter correctly');

    // Test C: Sort stores by name ASC
    const sortRes = await request(app).get('/api/stores?sortBy=name&sortOrder=ASC');
    assert(sortRes.status === 200, 'GET /api/stores?sortBy=name&sortOrder=ASC returns 200');

    // Test D: Store details by ID with star distribution
    const singleStoreRes = await request(app)
      .get('/api/stores/1')
      .set('Authorization', `Bearer ${userToken}`);
    assert(singleStoreRes.status === 200, 'GET /api/stores/:id returns single store (200)');
    assert(singleStoreRes.body.data.store.rating_distribution !== undefined, 'Returns star distribution');

    // Test E: Get current user rating for Store 1
    const myRatingRes = await request(app)
      .get('/api/stores/1/my-rating')
      .set('Authorization', `Bearer ${userToken}`);
    assert(myRatingRes.status === 200, 'GET /api/stores/:id/my-rating returns user rating state (200)');
    assert(myRatingRes.body.data.rated === true, 'Jonathan already has a rated status for Store 1');

    // Test F: Submit rating validation - invalid rating bounds
    const invalidRatingRes = await request(app)
      .post('/api/stores/5/rating')
      .set('Authorization', `Bearer ${newlyRegisteredToken}`)
      .send({ rating: 7 }); // Rating must be 1-5
    assert(invalidRatingRes.status === 422, 'POST /api/stores/:id/rating rejects rating > 5 (422)');

    // Test G: Submit fresh rating for Store 5 by newly registered user
    const submitRatingRes = await request(app)
      .post('/api/stores/5/rating')
      .set('Authorization', `Bearer ${newlyRegisteredToken}`)
      .send({ rating: 5 });
    assert(submitRatingRes.status === 201, 'POST /api/stores/:id/rating submits valid rating (201)');
    assert(submitRatingRes.body.data.user_rating === 5, 'Rating value is stored correctly');

    // Test H: Prevent duplicate rating submission for the same store
    const duplicateRatingRes = await request(app)
      .post('/api/stores/5/rating')
      .set('Authorization', `Bearer ${newlyRegisteredToken}`)
      .send({ rating: 4 });
    assert(duplicateRatingRes.status === 409, 'POST /api/stores/:id/rating prevents duplicate rating (409 Conflict)');

    // Test I: Modify existing rating via PUT
    const modifyRatingRes = await request(app)
      .put('/api/stores/5/rating')
      .set('Authorization', `Bearer ${newlyRegisteredToken}`)
      .send({ rating: 4 });
    assert(modifyRatingRes.status === 200, 'PUT /api/stores/:id/rating updates existing rating (200)');
    assert(modifyRatingRes.body.data.user_rating === 4, 'Updated rating reflects new value');

    // -------------------------------------------------------------------------
    // 5. STORE OWNER APIS
    // -------------------------------------------------------------------------
    console.log(cyan('\n--- Testing Store Owner APIs ---'));

    // Test A: Store owner dashboard
    const ownerDashRes = await request(app)
      .get('/api/owner/dashboard')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(ownerDashRes.status === 200, 'GET /api/owner/dashboard returns dashboard data (200)');
    assert(ownerDashRes.body.data.hasAssignedStore === true, 'Owner has assigned store');
    assert(ownerDashRes.body.data.metrics.average_rating > 0, 'Average rating is calculated');

    // Test B: Store owner ratings list
    const ownerRatingsRes = await request(app)
      .get('/api/owner/ratings')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(ownerRatingsRes.status === 200, 'GET /api/owner/ratings returns paginated raters (200)');
    assert(Array.isArray(ownerRatingsRes.body.data.ratings), 'Ratings list is an array');

    // Test C: Store owner store profile
    const ownerStoreRes = await request(app)
      .get('/api/owner/store')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert(ownerStoreRes.status === 200, 'GET /api/owner/store returns assigned store profile (200)');

    // -------------------------------------------------------------------------
    // 6. ADMIN APIS
    // -------------------------------------------------------------------------
    console.log(cyan('\n--- Testing Admin APIs ---'));

    // Test A: Admin dashboard metrics
    const adminDashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDashRes.status === 200, 'GET /api/admin/dashboard returns system stats (200)');
    assert(adminDashRes.body.data.users.total > 0, 'Admin sees total users');
    assert(adminDashRes.body.data.stores.total > 0, 'Admin sees total stores');
    assert(adminDashRes.body.data.ratings.total > 0, 'Admin sees total ratings');

    // Test B: Admin users list with role filter
    const adminUsersRes = await request(app)
      .get('/api/admin/users?role=STORE_OWNER')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminUsersRes.status === 200, 'GET /api/admin/users?role=STORE_OWNER returns 200');
    assert(
      adminUsersRes.body.data.users.every((u) => u.role === 'STORE_OWNER'),
      'Role filter strictly returns STORE_OWNER accounts'
    );
    assert(
      adminUsersRes.body.data.users.some((u) => u.store !== null),
      'Store owners in user list display their store name & store rating'
    );

    // Test C: Admin user details by ID (Store Owner)
    const adminUserDetailRes = await request(app)
      .get('/api/admin/users/2')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminUserDetailRes.status === 200, 'GET /api/admin/users/:id returns user details (200)');
    assert(adminUserDetailRes.body.data.user.store !== null, 'Store owner user details includes their store');
    assert(
      adminUserDetailRes.body.data.user.store.average_rating !== undefined,
      'Store owner user details displays their store rating'
    );

    // Test D: Admin creates a new Store Owner user
    const createOwnerRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Theodore Montgomery Kensington',
        email: 'theodore.kensington@example.com',
        password: 'AdminOwner@1234',
        address: '900 Financial Way, Commercial Plaza, Metro City',
        role: 'STORE_OWNER'
      });
    assert(createOwnerRes.status === 201, 'POST /api/admin/users creates new STORE_OWNER (201)');
    createdOwnerId = createOwnerRes.body.data.user.id;

    // Test E: Admin stores list
    const adminStoresRes = await request(app)
      .get('/api/admin/stores')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminStoresRes.status === 200, 'GET /api/admin/stores returns stores list (200)');

    // Test F: Admin creates a new store assigned to the newly created store owner
    const createStoreRes = await request(app)
      .post('/api/admin/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Kensington Fine Artisan Jewelers',
        email: 'contact@kensingtonjewelers.com',
        address: '900 Financial Way, Commercial Plaza, Metro City',
        ownerId: createdOwnerId
      });
    assert(createStoreRes.status === 201, 'POST /api/admin/stores creates new store with assigned owner (201)');

    // Test G: Admin views all platform ratings
    const adminRatingsRes = await request(app)
      .get('/api/admin/ratings')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminRatingsRes.status === 200, 'GET /api/admin/ratings returns all system ratings (200)');
    assert(adminRatingsRes.body.data.ratings.length > 0, 'Admin can view rating logs');

    console.log(cyan('\n======================================================'));
    console.log(` SUMMARY: ${passed} passed, ${failed} failed`);
    console.log(cyan('======================================================\n'));

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
};

runTests();
