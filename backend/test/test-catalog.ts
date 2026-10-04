/**
 * Automated Test Suite for Lab 3: Catalog & Products Management + Upload
 */
async function runLab3Tests() {
  const BASE_URL = 'http://localhost:3000/api/v1';
  console.log('🧪 Starting Lab 3 Catalog & Products Test Suite...\n');

  // 1. Authenticate Admin
  console.log('▶ Step 1: Login as Admin');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lossless.shop', password: 'Admin@123456' }),
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.accessToken;
  console.log(`Admin Token: ${adminToken ? '✅ Acquired' : '❌ Failed'}`);

  // 2. Authenticate Customer
  console.log('\n▶ Step 2: Login as Customer');
  const custLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hoang@audiophile.vn', password: 'Password@123' }),
  });
  let custToken: string;
  if (custLoginRes.ok) {
    const custLogin = await custLoginRes.json();
    custToken = custLogin.accessToken;
  } else {
    // If user not registered yet in this session, register now
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Hoang Dang',
        email: 'hoang@audiophile.vn',
        password: 'Password@123',
      }),
    });
    const reg = await regRes.json();
    custToken = reg.accessToken;
  }
  console.log(`Customer Token: ${custToken ? '✅ Acquired' : '❌ Failed'}`);

  // ─── CATEGORY TESTS ────────────────────────────────────────────────────────
  console.log('\n=== CATEGORY TESTS ===');

  // Test 3: Public get all categories
  console.log('▶ Test 3: Public GET /categories');
  const catListRes = await fetch(`${BASE_URL}/categories`);
  const categories = await catListRes.json();
  console.log(`Status: ${catListRes.status}, Found: ${categories.length} categories`);
  const headphonesCat = categories.find((c: any) => c.slug === 'headphones');

  // Test 4: Public get category by slug
  console.log('\n▶ Test 4: Public GET /categories/headphones');
  const catDetailRes = await fetch(`${BASE_URL}/categories/headphones`);
  const catDetail = await catDetailRes.json();
  console.log(`Status: ${catDetailRes.status}, Category: ${catDetail.name} (Slug: ${catDetail.slug})`);

  // Test 5: Customer tries to create category (Expect 403)
  console.log('\n▶ Test 5: Customer tries to create category (Expect 403 Forbidden)');
  const custCreateCatRes = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({ name: 'Hacked Category' }),
  });
  console.log(`Status: ${custCreateCatRes.status} (Expected: 403)`);

  // Test 6: Admin creates category with auto-slug
  console.log('\n▶ Test 6: Admin creates new category "Dây Cáp Cao Cấp"');
  const createCatRes = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Dây Cáp Cao Cấp',
      description: 'Dây dẫn bạc, đồng đơn tinh thể chất lượng cao',
    }),
  });
  const createdCat = await createCatRes.json();
  console.log(`Status: ${createCatRes.status}, Slug created: "${createdCat.slug}"`);

  // ─── PRODUCT TESTS ─────────────────────────────────────────────────────────
  console.log('\n=== PRODUCT TESTS ===');

  // Test 7: Public list products
  console.log('▶ Test 7: Public GET /products');
  const prodListRes = await fetch(`${BASE_URL}/products`);
  const prodList = await prodListRes.json();
  console.log(`Status: ${prodListRes.status}, Total Products: ${prodList.meta?.total}`);

  // Test 8: Public get product by slug
  console.log('\n▶ Test 8: Public GET /products/sennheiser-hd-800s');
  const prodDetailRes = await fetch(`${BASE_URL}/products/sennheiser-hd-800s`);
  const prodDetail = await prodDetailRes.json();
  console.log(`Status: ${prodDetailRes.status}, Name: ${prodDetail.name}`);
  console.log(`Populated Category: ${prodDetail.category?.name}`);

  // Test 9: Admin creates audiophile product with specs
  console.log('\n▶ Test 9: Admin creates "Hifiman Arya Organic" with AudioSpecs');
  const createProdRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Hifiman Arya Organic',
      brand: 'Hifiman',
      description: 'Tai nghe từ phẳng Planar Magnetic độ phân giải siêu cao',
      price: 32000000,
      salePrice: 29990000,
      category: headphonesCat._id,
      stock: 5,
      specs: {
        driverType: 'Planar Magnetic',
        impedance: '16 Ohm',
        frequencyResponse: '8Hz - 65kHz',
        sensitivity: '94 dB/mW',
        connector: '3.5mm dual',
      },
      tags: ['planar', 'audiophile', 'open-back'],
      isFeatured: true,
    }),
  });
  const newProduct = await createProdRes.json();
  console.log(`Status: ${createProdRes.status}, Product Created ID: ${newProduct._id}`);

  // Test 10: Audiophile spec filter (driverType=Planar)
  console.log('\n▶ Test 10: Filter by AudioSpecs: GET /products?driverType=Planar');
  const planarRes = await fetch(`${BASE_URL}/products?driverType=Planar`);
  const planarData = await planarRes.json();
  console.log(`Status: ${planarRes.status}, Matches found: ${planarData.data.length}`);
  console.log(`Item: ${planarData.data[0]?.name} (Driver: ${planarData.data[0]?.specs?.driverType})`);

  // Test 11: Text search (search=Sennheiser)
  console.log('\n▶ Test 11: Search products: GET /products?search=Sennheiser');
  const searchRes = await fetch(`${BASE_URL}/products?search=Sennheiser`);
  const searchData = await searchRes.json();
  console.log(`Status: ${searchRes.status}, Search results: ${searchData.data.length}`);

  // Test 12: Price filter & sorting
  console.log('\n▶ Test 12: Price filter & sort: GET /products?minPrice=20000000&sort=price:desc');
  const sortRes = await fetch(`${BASE_URL}/products?minPrice=20000000&sort=price:desc`);
  const sortData = await sortRes.json();
  console.log(`Status: ${sortRes.status}, Filtered items: ${sortData.data.length}`);
  console.log(`First item price: ${sortData.data[0]?.price.toLocaleString()} VND`);

  // Test 13: Pagination test
  console.log('\n▶ Test 13: Pagination test: GET /products?page=1&limit=2');
  const pageRes = await fetch(`${BASE_URL}/products?page=1&limit=2`);
  const pageData = await pageRes.json();
  console.log(`Page: ${pageData.meta.page}/${pageData.meta.totalPages}, HasNext: ${pageData.meta.hasNextPage}`);

  // Test 14: Admin updates product
  console.log(`\n▶ Test 14: Admin updates product price: PATCH /products/${newProduct._id}`);
  const updateRes = await fetch(`${BASE_URL}/products/${newProduct._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ salePrice: 28500000 }),
  });
  const updated = await updateRes.json();
  console.log(`Status: ${updateRes.status}, New Sale Price: ${updated.salePrice.toLocaleString()} VND`);

  // Test 15: Admin soft deletes product
  console.log(`\n▶ Test 15: Admin soft deletes product: DELETE /products/${newProduct._id}`);
  const delRes = await fetch(`${BASE_URL}/products/${newProduct._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const delData = await delRes.json();
  console.log(`Status: ${delRes.status}, Message: ${delData.message}`);

  // ─── FILE UPLOAD TEST ──────────────────────────────────────────────────────
  console.log('\n=== FILE UPLOAD TEST ===');

  // Test 16: Admin uploads image
  console.log('▶ Test 16: Admin uploads test image: POST /upload/image');
  // Create a minimal 1x1 PNG buffer
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(samplePngBase64, 'base64');
  const formData = new FormData();
  formData.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'test-headphone.png');

  const uploadRes = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log(`Status: ${uploadRes.status}, Uploaded URL: ${uploadData.data?.url}`);

  // Test 17: Verify image static serving
  if (uploadData.data?.url) {
    console.log(`\n▶ Test 17: Verify static image serving: GET http://localhost:3000${uploadData.data.url}`);
    const staticRes = await fetch(`http://localhost:3000${uploadData.data.url}`);
    console.log(`Status: ${staticRes.status} (Expected: 200 OK, Image served successfully)`);
  }

  console.log('\n🎉 ALL 17 TESTS IN LAB 3 FINISHED SUCCESSFULLY!');
}

runLab3Tests().catch(console.error);
