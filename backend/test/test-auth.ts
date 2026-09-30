/**
 * Automated Test Suite for Lab 2: Auth & Role Guard
 */
async function runTests() {
  const BASE_URL = 'http://localhost:3000/api/v1';

  console.log('🧪 Starting Lab 2 Auth Test Suite...\n');

  // Test 1: Register new customer
  console.log('▶ Test 1: Register new customer (hoang@audiophile.vn)');
  const registerPayload = {
    fullName: 'Hoang Dang',
    email: 'hoang@audiophile.vn',
    password: 'Password@123',
    phone: '0901234567',
    address: {
      street: '123 Nguyen Hue',
      city: 'Ho Chi Minh',
      district: 'Quan 1',
      ward: 'Ben Nghe',
    },
  };

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });
  const regData = await regRes.json();
  console.log(`Status: ${regRes.status}`);
  console.log(`Response:`, JSON.stringify(regData, null, 2));

  // Test 2: Duplicate registration test (Expect 409 Conflict)
  console.log('\n▶ Test 2: Register with same email (Expect 409 Conflict)');
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });
  const dupData = await dupRes.json();
  console.log(`Status: ${dupRes.status} (Expected: 409)`);
  console.log(`Response:`, dupData);

  // Test 3: Validation test (Expect 400 Bad Request with password < 6 chars)
  console.log('\n▶ Test 3: Register with short password (Expect 400 Bad Request)');
  const invalidRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Test', email: 'test@invalid.vn', password: '123' }),
  });
  const invalidData = await invalidRes.json();
  console.log(`Status: ${invalidRes.status} (Expected: 400)`);
  console.log(`Response:`, invalidData);

  // Test 4: Login with correct credentials
  console.log('\n▶ Test 4: Login with customer credentials');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hoang@audiophile.vn', password: 'Password@123' }),
  });
  const loginData = await loginRes.json();
  console.log(`Status: ${loginRes.status}`);
  const customerToken = loginData.accessToken;
  console.log(`Received Token: ${customerToken ? '✅ YES' : '❌ NO'}`);
  console.log(`User Role: ${loginData.user?.role}`);

  // Test 5: Login with wrong password (Expect 401 Unauthorized)
  console.log('\n▶ Test 5: Login with wrong password (Expect 401 Unauthorized)');
  const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hoang@audiophile.vn', password: 'WrongPassword' }),
  });
  const wrongLoginData = await wrongLoginRes.json();
  console.log(`Status: ${wrongLoginRes.status} (Expected: 401)`);
  console.log(`Response:`, wrongLoginData);

  // Test 6: Access GET /auth/me without token (Expect 401)
  console.log('\n▶ Test 6: Access GET /auth/me without token (Expect 401)');
  const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
  const noTokenData = await noTokenRes.json();
  console.log(`Status: ${noTokenRes.status} (Expected: 401)`);
  console.log(`Response:`, noTokenData);

  // Test 7: Access GET /auth/me with Bearer token (Expect 200 OK + profile)
  console.log('\n▶ Test 7: Access GET /auth/me with Bearer token (Expect 200 OK)');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const meData = await meRes.json();
  console.log(`Status: ${meRes.status} (Expected: 200)`);
  console.log(`User Profile:`, meData);

  // Test 8: Customer tries to access Admin route (Expect 403 Forbidden)
  console.log('\n▶ Test 8: Customer tries to access /auth/admin-check (Expect 403 Forbidden)');
  const forbiddenRes = await fetch(`${BASE_URL}/auth/admin-check`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const forbiddenData = await forbiddenRes.json();
  console.log(`Status: ${forbiddenRes.status} (Expected: 403)`);
  console.log(`Response:`, forbiddenData);

  // Test 9: Login as seeded Admin and access /auth/admin-check (Expect 200 OK)
  console.log('\n▶ Test 9: Login as seeded Admin (admin@lossless.shop)');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lossless.shop', password: 'Admin@123456' }),
  });
  const adminLoginData = await adminLoginRes.json();
  console.log(`Status: ${adminLoginRes.status}`);
  const adminToken = adminLoginData.accessToken;
  console.log(`Admin Role: ${adminLoginData.user?.role}`);

  console.log('\n▶ Test 10: Admin accesses /auth/admin-check (Expect 200 OK)');
  const adminCheckRes = await fetch(`${BASE_URL}/auth/admin-check`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminCheckData = await adminCheckRes.json();
  console.log(`Status: ${adminCheckRes.status} (Expected: 200)`);
  console.log(`Response:`, adminCheckData);

  console.log('\n🎉 ALL 10 TESTS FINISHED!');
}

runTests().catch(console.error);
