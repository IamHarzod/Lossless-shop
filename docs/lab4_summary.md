# Lab 4 — Giỏ hàng (Cart) & Quản lý Đơn hàng (Order Management)

> **Status:** ✅ COMPLETED & COMPILED (0 errors)  
> **Stack:** NestJS + Mongoose (Sub-documents, Price Snapshot, Inventory Control) + Passport JWT Guards

---

## 1. Cấu trúc thư mục mới tạo trong Lab 4

```text
backend/
├── src/
│   ├── modules/
│   │   ├── cart/
│   │   │   ├── dto/
│   │   │   │   ├── add-to-cart.dto.ts
│   │   │   │   ├── update-cart-item.dto.ts
│   │   │   │   └── merge-cart.dto.ts       ← Gộp giỏ hàng khách vãng lai khi login
│   │   │   ├── guards/
│   │   │   │   └── optional-jwt-auth.guard.ts ← Hỗ trợ đồng thời cả Guest & User
│   │   │   ├── cart.service.ts             ← Logic giỏ hàng, tính tổng tiền, snapshot giá
│   │   │   ├── cart.controller.ts          ← 6 Endpoints giỏ hàng
│   │   │   ├── cart.module.ts
│   │   │   └── index.ts
│   │   └── orders/
│   │       ├── dto/
│   │       │   ├── create-order.dto.ts     ← Đặt hàng (từ giỏ hoặc trực tiếp)
│   │       │   ├── shipping-address.dto.ts ← Snapshot địa chỉ giao hàng
│   │       │   ├── update-order-status.dto.ts
│   │       │   ├── update-payment-status.dto.ts
│   │       │   └── order-query.dto.ts      ← Lọc và phân trang đơn hàng
│   │       ├── orders.service.ts           ← Trừ tồn kho, snapshot, hoàn kho khi hủy đơn
│   │       ├── orders.controller.ts        ← 7 Endpoints đơn hàng (Customer & Admin)
│   │       ├── orders.module.ts
│   │       └── index.ts
│   └── app.module.ts                       ← Đã tích hợp CartModule và OrdersModule
└── test/
    └── test-cart-order.ts                  ← Test suite tự động 17 test cases cho Lab 4
```

---

## 2. Chi tiết các Endpoints trong Lab 4

Tất cả các endpoint đều có tiền tố `/api/v1`:

### 🛒 A. Giỏ hàng (Cart)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Public / User | Lấy thông tin giỏ hàng hiện tại (qua Bearer Token hoặc `?sessionId=...`) |
| `POST` | `/api/v1/cart/items` | Public / User | Thêm sản phẩm vào giỏ (tự động lưu `priceSnapshot`, kiểm tra tồn kho) |
| `PATCH` | `/api/v1/cart/items/:productId` | Public / User | Cập nhật số lượng sản phẩm trong giỏ (số lượng $\le 0$ sẽ tự xóa) |
| `DELETE`| `/api/v1/cart/items/:productId` | Public / User | Xóa một sản phẩm khỏi giỏ hàng |
| `DELETE`| `/api/v1/cart` | Public / User | Xóa toàn bộ sản phẩm trong giỏ hàng |
| `POST` | `/api/v1/cart/merge` | User (`JwtAuthGuard`) | Gộp giỏ hàng khách vãng lai (`sessionId`) vào tài khoản sau khi đăng nhập |

---

### 📦 B. Đơn hàng (Orders)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | Customer | Đặt hàng mới (tự động lấy từ giỏ hoặc danh sách truyền lên, tự trừ tồn kho, tự làm trống giỏ) |
| `GET` | `/api/v1/orders/my-orders` | Customer | Xem lịch sử đơn hàng của bản thân (phân trang, sắp xếp mới nhất) |
| `GET` | `/api/v1/orders/:orderCodeOrId` | Customer / Admin | Xem chi tiết đơn hàng (khách chỉ xem được đơn của mình, admin xem được tất cả) |
| `PATCH` | `/api/v1/orders/:orderCodeOrId/cancel` | Customer / Admin | Hủy đơn hàng khi còn `pending` $\rightarrow$ **Tự động hoàn trả tồn kho (restock)** |
| `GET` | `/api/v1/orders` | Admin | Quản lý danh sách toàn bộ đơn hàng (lọc theo `status`, `paymentStatus`, tìm kiếm, phân trang) |
| `PATCH` | `/api/v1/orders/:id/status` | Admin | Cập nhật trạng thái đơn hàng (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`) |
| `PATCH` | `/api/v1/orders/:id/payment-status` | Admin | Cập nhật trạng thái thanh toán (`pending`, `paid`, `failed`, `refunded`, kèm `transactionId`) |

---

## 3. Các kỹ thuật & quy tắc nghiệp vụ cốt lõi

1. **Price Snapshot (Bảo vệ giá):**
   - Giá sản phẩm tại thời điểm thêm vào giỏ và đặt hàng được lưu bất biến (`priceSnapshot`, `unitPrice`, `subtotal`). Nếu sau này Admin có tăng/giảm giá sản phẩm, đơn hàng cũ và giỏ hàng vẫn giữ đúng giá trị lúc mua.
2. **Quản lý kho tự động (Inventory Control):**
   - Khi đặt hàng: Hệ thống kiểm tra số lượng tồn kho và **trừ trực tiếp** `product.stock -= quantity`.
   - Khi hủy đơn (`cancelled`): Hệ thống **tự động hoàn trả lại kho** `product.stock += quantity`.
3. **Mã đơn hàng chuyên nghiệp:**
   - Tự động sinh mã độc nhất dạng: `LS-YYYYMMDD-XXXX` (ví dụ: `LS-20261005-9B2F`).
4. **Xóa mềm (Soft Delete):**
   - Đơn hàng **KHÔNG BAO GIỜ bị xóa cứng khỏi cơ sở dữ liệu** (`isDeleted: false`).
5. **Đồng bộ thanh toán thông minh:**
   - Với đơn hàng thanh toán khi nhận hàng (`cod`), khi Admin cập nhật trạng thái đơn thành `delivered`, hệ thống tự động đổi `paymentStatus` sang `paid`.

---

## 4. Cách chạy kiểm thử Lab 4

Khi Docker Desktop và MongoDB đang chạy, bạn chỉ cần gõ:
```bash
npm run test:order
```
Suite kiểm thử tự động gồm **17 test cases** bao phủ toàn bộ luồng: thêm giỏ hàng, gộp giỏ vãng lai, đặt hàng, kiểm tra trừ kho, xem lịch sử đơn, hủy đơn hoàn trả kho, và cập nhật trạng thái Admin!
