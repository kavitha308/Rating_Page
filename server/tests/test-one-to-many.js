process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

const runTests = async () => {
  console.log('\n======================================================');
  console.log('  TESTING ONE-TO-MANY (1:N) STORE OWNER RELATIONSHIP  ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`PASS ${description}`);
      passed++;
    } else {
      console.error(`FAIL ${description}`);
      failed++;
    }
  };

  // Ensure DB initialized
  await request(app).get('/api/health');

  // 1. Authenticate Admin
  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@storerating.com', password: 'Admin@1234' });
  assert(adminLoginRes.status === 200, 'Admin authenticates successfully');
  const adminToken = adminLoginRes.body.data.token;

  // Test 1: Create Store Owner "John" and assign Store A -> John
  console.log('\n--- Test 1: Create Store Owner "John" & Store A -> John ---');
  const createJohnRes = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Johnathan Alexander Smith',
      email: 'john.smith.unique.test@example.com',
      password: 'OwnerPass123!',
      address: '777 Commerce Boulevard, Suite 100, Capital District',
      role: 'STORE_OWNER'
    });
  assert(createJohnRes.status === 201, 'Created Store Owner Johnathan Alexander Smith (201)');
  const johnId = createJohnRes.body.data.user.id;

  const createStoreARes = await request(app)
    .post('/api/admin/stores')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'John Super Store Alpha Branch',
      email: 'alpha@johnsuperstores.com',
      address: '101 Alpha Boulevard, Commercial Plaza, Capital District',
      ownerId: johnId
    });
  assert(createStoreARes.status === 201, 'Store A created and assigned to John (201)');
  const storeAId = createStoreARes.body.data.store.id;

  // Test 2: Create another store: Store B -> John (Reusing John!)
  console.log('\n--- Test 2: Create Store B -> John (Reusing Same Owner) ---');
  const createStoreBRes = await request(app)
    .post('/api/admin/stores')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'John Super Store Beta Branch',
      email: 'beta@johnsuperstores.com',
      address: '202 Beta Boulevard, Commercial Plaza, Capital District',
      ownerId: johnId
    });
  assert(createStoreBRes.status === 201, 'Store B created and assigned to John (201)');
  const storeBId = createStoreBRes.body.data.store.id;

  // Test 3: Create Store C -> John
  console.log('\n--- Test 3: Create Store C -> John ---');
  const createStoreCRes = await request(app)
    .post('/api/admin/stores')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'John Super Store Gamma Branch',
      email: 'gamma@johnsuperstores.com',
      address: '303 Gamma Boulevard, Commercial Plaza, Capital District',
      ownerId: johnId
    });
  assert(createStoreCRes.status === 201, 'Store C created and assigned to John (201)');
  const storeCId = createStoreCRes.body.data.store.id;

  // Test 4 & 5: Admin fetches Store Owners for dropdown; John appears and is selectable
  console.log('\n--- Test 4 & 5: John appears in Store Owners list ---');
  const ownersListRes = await request(app)
    .get('/api/admin/users?role=STORE_OWNER')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(ownersListRes.status === 200, 'Admin fetches store owners list (200)');
  const owners = ownersListRes.body.data.users;
  const johnInList = owners.find((u) => u.id === johnId);
  assert(Boolean(johnInList), 'Johnathan Alexander Smith is in the store owners list');
  assert(johnInList && johnInList.store_count >= 3, `John store_count indicates ${johnInList?.store_count} stores`);

  // Also create a second Store Owner: "Rahul"
  const createRahulRes = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Rahul Vikramaditya Sharma',
      email: 'rahul.sharma.test@example.com',
      password: 'OwnerPass123!',
      address: '888 Royal Palm Avenue, High Tech Park, Metro West',
      role: 'STORE_OWNER'
    });
  assert(createRahulRes.status === 201, 'Created Store Owner Rahul (201)');
  const rahulId = createRahulRes.body.data.user.id;

  const createRahulStoreRes = await request(app)
    .post('/api/admin/stores')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Rahul Electronics & Gadgets Hub',
      email: 'contact@rahulgadgetshub.com',
      address: '889 Royal Palm Avenue, High Tech Park, Metro West',
      ownerId: rahulId
    });
  assert(createRahulStoreRes.status === 201, 'Rahul store created (201)');
  const rahulStoreId = createRahulStoreRes.body.data.store.id;

  // Test 6: John logs in. Store A, Store B, Store C are visible
  console.log('\n--- Test 6: John logs in and sees Store A, Store B, Store C ---');
  const johnLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'john.smith.unique.test@example.com', password: 'OwnerPass123!' });
  assert(johnLoginRes.status === 200, 'John logs in successfully (200)');
  const johnToken = johnLoginRes.body.data.token;

  const johnDashboardRes = await request(app)
    .get('/api/owner/dashboard')
    .set('Authorization', `Bearer ${johnToken}`);
  assert(johnDashboardRes.status === 200, 'John dashboard loaded (200)');
  assert(johnDashboardRes.body.data.storesCount >= 3, `John dashboard shows ${johnDashboardRes.body.data.storesCount} stores`);
  const johnStoreNames = johnDashboardRes.body.data.stores.map((s) => s.name);
  assert(johnStoreNames.includes('John Super Store Alpha Branch'), 'Store A is visible in John dashboard');
  assert(johnStoreNames.includes('John Super Store Beta Branch'), 'Store B is visible in John dashboard');
  assert(johnStoreNames.includes('John Super Store Gamma Branch'), 'Store C is visible in John dashboard');

  // Test 7: Another Store Owner, Rahul, logs in. Rahul sees ONLY his own stores
  console.log('\n--- Test 7: Rahul logs in and sees ONLY his own stores ---');
  const rahulLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'rahul.sharma.test@example.com', password: 'OwnerPass123!' });
  assert(rahulLoginRes.status === 200, 'Rahul logs in successfully (200)');
  const rahulToken = rahulLoginRes.body.data.token;

  const rahulDashboardRes = await request(app)
    .get('/api/owner/dashboard')
    .set('Authorization', `Bearer ${rahulToken}`);
  assert(rahulDashboardRes.status === 200, 'Rahul dashboard loaded (200)');
  const rahulStoreNames = rahulDashboardRes.body.data.stores.map((s) => s.name);
  assert(rahulStoreNames.includes('Rahul Electronics & Gadgets Hub'), 'Rahul sees his own store');
  assert(!rahulStoreNames.includes('John Super Store Alpha Branch'), 'Rahul does NOT see Store A');
  assert(!rahulStoreNames.includes('John Super Store Beta Branch'), 'Rahul does NOT see Store B');

  // Test 8: John attempts to access Rahul's store through an API request. Expected: 403 Forbidden
  console.log("\n--- Test 8: John attempts to access Rahul's store (Security check) ---");
  const unauthorizedAccessRes = await request(app)
    .get(`/api/owner/store/${rahulStoreId}`)
    .set('Authorization', `Bearer ${johnToken}`);
  assert(unauthorizedAccessRes.status === 403, `John access to Rahul store rejected with 403 Forbidden (got ${unauthorizedAccessRes.status})`);

  // Test 9: Admin changes Store A -> Rahul. Expected: Store A is removed from John's managed stores
  console.log('\n--- Test 9: Admin edits Store A to assign to Rahul ---');
  const updateStoreARes = await request(app)
    .put(`/api/admin/stores/${storeAId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'John Super Store Alpha Branch',
      email: 'alpha@johnsuperstores.com',
      address: '101 Alpha Boulevard, Commercial Plaza, Capital District',
      ownerId: rahulId
    });
  assert(updateStoreARes.status === 200, 'Admin updated Store A owner to Rahul (200)');

  // Test 10: John still owns Store B and Store C. John's dashboard still displays Store B and Store C
  console.log('\n--- Test 10: John dashboard still displays Store B and Store C, but not Store A ---');
  const johnDashboardAfterEdit = await request(app)
    .get('/api/owner/dashboard')
    .set('Authorization', `Bearer ${johnToken}`);
  assert(johnDashboardAfterEdit.status === 200, 'John dashboard loaded after ownership change (200)');
  const johnStoresAfter = johnDashboardAfterEdit.body.data.stores.map((s) => s.name);
  assert(!johnStoresAfter.includes('John Super Store Alpha Branch'), 'Store A successfully removed from John dashboard');
  assert(johnStoresAfter.includes('John Super Store Beta Branch'), 'Store B remains in John dashboard');
  assert(johnStoresAfter.includes('John Super Store Gamma Branch'), 'Store C remains in John dashboard');

  console.log('\n======================================================');
  console.log(` SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
