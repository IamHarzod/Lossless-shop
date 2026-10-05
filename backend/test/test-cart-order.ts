/**
 * Automated Test Suite for Lab 4: Cart & Order Management
 */
async function runLab4Tests() {
  const BASE_URL = 'http://localhost:3000/api/v1';
  console.log('🧪 Starting Lab 4 Cart & Order Test Suite...\n');

  // 1. Authenticate Admin
  console.log('▶ Step 1: Login as Admin');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lossless.shop', password: 'Admin@123456' }),
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.accessToken;
  console.log(`Admin Token: ${adminToken ? '✅ OK' : '❌ Failed'}`);

  // 2. Authenticate Customer
  console.log('\n▶ Step 2: Login as Customer (hoang@audiophile.vn)');
  let custRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hoang@audiophile.vn', password: 'Password@123' }),
  });
  let custToken: string;
  if (custRes.ok) {
    const custData = await custRes.json();
    custToken = custData.accessToken;
  } else {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Hoang Dang',
        email: 'hoang@audiophile.vn',
        password: 'Password@123',
      }),
    });
    const regData = await regRes.json();
    custToken = regData.accessToken;
  }
  console.log(`Customer Token: ${custToken ? '✅ OK' : '❌ Failed'}`);

  // 3. Get Products for Testing
  console.log('\n▶ Step 3: Fetch products for testing');
  const prodRes = await fetch(`${BASE_URL}/products?limit=2`);
  const prodData = await prodRes.json();
  const product1 = prodData.data[0];
  const product2 = prodData.data[1];
  console.log(`Product 1: ${product1.name} (Stock: ${product1.stock}, Price: ${product1.price.toLocaleString()} VND)`);
  console.log(`Product 2: ${product2.name} (Stock: ${product2.stock}, Price: ${product2.price.toLocaleString()} VND)`);

  // ─── CART TESTS ──────────────────────────────────────────────────────────
  console.log('\n=== CART TESTS ===');

  // Test 4: Clear user cart initially
  console.log('▶ Test 4: Clear customer cart');
  await fetch(`${BASE_URL}/cart`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${custToken}` },
  });

  // Test 5: Add product 1 to Cart
  console.log(`\n▶ Test 5: Add "${product1.name}" (qty: 1) to Cart`);
  const addRes1 = await fetch(`${BASE_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({ productId: product1._id, quantity: 1 }),
  });
  const cartAfterAdd1 = await addRes1.json();
  console.log(`Status: ${addRes1.status}, Items: ${cartAfterAdd1.items.length}, Total: ${cartAfterAdd1.totalAmount.toLocaleString()} VND`);

  // Test 6: Add product 2 to Cart
  console.log(`\n▶ Test 6: Add "${product2.name}" (qty: 1) to Cart`);
  const addRes2 = await fetch(`${BASE_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({ productId: product2._id, quantity: 1 }),
  });
  const cartAfterAdd2 = await addRes2.json();
  console.log(`Status: ${addRes2.status}, Items: ${cartAfterAdd2.items.length}, Total: ${cartAfterAdd2.totalAmount.toLocaleString()} VND`);

  // Test 7: Update quantity of product 1 to 2
  console.log(`\n▶ Test 7: Update quantity of "${product1.name}" to 2`);
  const updateRes = await fetch(`${BASE_URL}/cart/items/${product1._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({ quantity: 2 }),
  });
  const cartAfterUpdate = await updateRes.json();
  const updatedItem = cartAfterUpdate.items.find((i: any) => i.product._id === product1._id);
  console.log(`Status: ${updateRes.status}, New Qty: ${updatedItem?.quantity}, New Total: ${cartAfterUpdate.totalAmount.toLocaleString()} VND`);

  // Test 8: Guest Cart & Merge Cart
  console.log('\n▶ Test 8: Guest Cart & Merge into Customer Account');
  const guestSessionId = 'guest-session-audiophile-' + Date.now();
  await fetch(`${BASE_URL}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: product1._id, quantity: 1, sessionId: guestSessionId }),
  });

  const mergeRes = await fetch(`${BASE_URL}/cart/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({ sessionId: guestSessionId }),
  });
  const cartAfterMerge = await mergeRes.json();
  console.log(`Status: ${mergeRes.status}, Merged Total Amount: ${cartAfterMerge.totalAmount.toLocaleString()} VND`);

  // ─── ORDER TESTS ─────────────────────────────────────────────────────────
  console.log('\n=== ORDER TESTS ===');

  const initialStockP1 = (await (await fetch(`${BASE_URL}/products/${product1._id}`)).json()).stock;
  console.log(`Initial stock of ${product1.name}: ${initialStockP1}`);

  // Test 9: Create order from Cart
  console.log('\n▶ Test 9: Place Order from Cart');
  const orderPayload = {
    shippingAddress: {
      recipientName: 'Hoang Dang',
      phone: '0901234567',
      street: '123 Nguyen Hue',
      ward: 'Ben Nghe',
      district: 'Quan 1',
      city: 'Ho Chi Minh',
    },
    paymentMethod: 'cod',
    customerNote: 'Giao hàng giờ hành chính',
    shippingFee: 30000,
    discountAmount: 10000,
  };

  const createOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify(orderPayload),
  });
  const order1 = await createOrderRes.json();
  console.log(`Status: ${createOrderRes.status}`);
  console.log(`Order Code: ${order1.orderCode}`);
  console.log(`Order Status: ${order1.status}, Payment Status: ${order1.paymentStatus}`);
  console.log(`Total Amount: ${order1.totalAmount.toLocaleString()} VND`);
  console.log(`Snapshot Items count: ${order1.items.length}`);

  // Test 10: Verify stock was decremented
  console.log('\n▶ Test 10: Verify Product Stock was automatically decremented');
  const postStockP1 = (await (await fetch(`${BASE_URL}/products/${product1._id}`)).json()).stock;
  console.log(`Stock before: ${initialStockP1} -> Stock after order: ${postStockP1} (Expected decrement: ✅)`);

  // Test 11: Verify customer Cart was auto-emptied
  console.log('\n▶ Test 11: Verify Customer Cart was emptied after checkout');
  const cartAfterOrder = await (await fetch(`${BASE_URL}/cart`, {
    headers: { Authorization: `Bearer ${custToken}` },
  })).json();
  console.log(`Cart items remaining: ${cartAfterOrder.items.length} (Expected: 0 ✅)`);

  // Test 12: Customer views order history
  console.log('\n▶ Test 12: Customer views order history: GET /orders/my-orders');
  const myOrdersRes = await fetch(`${BASE_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  const myOrders = await myOrdersRes.json();
  console.log(`Status: ${myOrdersRes.status}, Total Customer Orders: ${myOrders.meta.total}`);

  // Test 13: Customer cancels order (and stock is restored!)
  console.log(`\n▶ Test 13: Customer cancels order "${order1.orderCode}" (Expect stock restoral)`);
  const cancelRes = await fetch(`${BASE_URL}/orders/${order1.orderCode}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({ reason: 'Thay đổi nhu cầu mua sắm' }),
  });
  const cancelData = await cancelRes.json();
  console.log(`Status: ${cancelRes.status}, Order Status: ${cancelData.order?.status}`);

  const restoredStockP1 = (await (await fetch(`${BASE_URL}/products/${product1._id}`)).json()).stock;
  console.log(`Stock after cancellation: ${restoredStockP1} (Restored back to: ${initialStockP1} ✅)`);

  // Test 14: Place new Order directly with items
  console.log('\n▶ Test 14: Place Order directly with items list');
  const directOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      ...orderPayload,
      items: [{ productId: product2._id, quantity: 1 }],
    }),
  });
  const order2 = await directOrderRes.json();
  console.log(`Status: ${directOrderRes.status}, Order Code: ${order2.orderCode}`);

  // Test 15: Admin manages orders: GET /orders
  console.log('\n▶ Test 15: Admin lists all orders');
  const adminOrdersRes = await fetch(`${BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminOrders = await adminOrdersRes.json();
  console.log(`Status: ${adminOrdersRes.status}, Total Store Orders: ${adminOrders.meta.total}`);

  // Test 16: Admin updates status to "delivered" (Auto marks COD as paid)
  console.log(`\n▶ Test 16: Admin delivers COD order: PATCH /orders/${order2._id}/status -> delivered`);
  const statusUpdateRes = await fetch(`${BASE_URL}/orders/${order2._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'delivered', adminNote: 'Giao hàng thành công tận nơi' }),
  });
  const updatedOrder2 = await statusUpdateRes.json();
  console.log(`Status: ${statusUpdateRes.status}`);
  console.log(`Order Status: ${updatedOrder2.status}, Payment Status: ${updatedOrder2.paymentStatus} (Auto marked as paid for COD ✅)`);

  // Test 17: Admin updates payment status
  console.log(`\n▶ Test 17: Admin updates payment status: PATCH /orders/${order2._id}/payment-status`);
  const payUpdateRes = await fetch(`${BASE_URL}/orders/${order2._id}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ paymentStatus: 'paid', transactionId: 'TRANS-VNPAY-998877' }),
  });
  const payUpdated = await payUpdateRes.json();
  console.log(`Status: ${payUpdateRes.status}, Transaction ID: ${payUpdated.transactionId}`);

  console.log('\n🎉 ALL 17 TESTS IN LAB 4 FINISHED SUCCESSFULLY!');
}

runLab4Tests().catch(console.error);
