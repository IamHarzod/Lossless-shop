# Lab 2 — Xác thực (Authentication) & Phân quyền (Authorization)

> **Status:** ✅ COMPLETED & TESTED (10/10 tests passed)  
> **Stack:** NestJS + Passport JWT + bcrypt + class-validator + Mongoose

---

## 1. Cấu trúc thư mục mới tạo trong Lab 2

```text
backend/
├── src/
│   ├── modules/
│   │   ├── users/
│   │   │   ├── users.service.ts         ← Xử lý hash bcrypt, tìm kiếm, cập nhật user
│   │   │   ├── users.module.ts          ← Đăng ký UserModel, export UsersService
│   │   │   └── index.ts
│   │   └── auth/
│   │       ├── dto/
│   │       │   ├── register.dto.ts      ← Validate dữ liệu đăng ký + địa chỉ
│   │       │   └── login.dto.ts         ← Validate email & password đăng nhập
│   │       ├── decorators/
│   │       │   ├── roles.decorator.ts   ← Decorator @Roles(UserRole.ADMIN)
│   │       │   └── current-user.decorator.ts ← Decorator @CurrentUser() lấy thông tin user
│   │       ├── guards/
│   │       │   ├── jwt-auth.guard.ts    ← Chặn truy cập nếu thiếu hoặc sai JWT token
│   │       │   └── roles.guard.ts       ← Kiểm tra quyền Admin/Customer
│   │       ├── strategies/
│   │       │   └── jwt.strategy.ts      ← Passport JWT Strategy giải mã & verify token
│   │       ├── auth.service.ts          ← Logic đăng ký, đăng nhập, cấp phát JWT
│   │       ├── auth.controller.ts       ← 4 Endpoints Auth
│   │       ├── auth.module.ts           ← Cấu hình JwtModule, PassportModule
│   │       └── index.ts
│   ├── app.module.ts                    ← Đã tích hợp UsersModule và AuthModule
│   └── main.ts
└── test/
    └── test-auth.ts                     ← Test suite tự động 10 test cases
```

---

## 2. Danh sách API Endpoints của Lab 2

Tất cả các endpoint đều có tiền tố `/api/v1`:

| Phương thức | Endpoint | Quyền hạn (Guard) | Mô tả |
|-------------|----------|-------------------|-------|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký khách hàng mới (mặc định role `customer`, hash bcrypt 10 rounds) |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập bằng Email + Mật khẩu, trả về `accessToken` (JWT 7 ngày) |
| `GET` | `/api/v1/auth/me` | `JwtAuthGuard` | Lấy profile người dùng hiện tại từ Bearer Token |
| `GET` | `/api/v1/auth/admin-check` | `JwtAuthGuard` + `RolesGuard` | Endpoint mẫu kiểm tra quyền Admin (`@Roles(UserRole.ADMIN)`) |

---

## 3. Các tính năng bảo mật đã triển khai

1. **Bcrypt Password Hashing:**
   - Mật khẩu người dùng luôn được băm với salt rounds cấu hình trong `.env` (`BCRYPT_SALT_ROUNDS=10`).
   - Schema MongoDB đặt `select: false` cho trường `password` $\rightarrow$ không bao giờ vô tình leak mật khẩu ra ngoài JSON response.
2. **Passport JWT Strategy:**
   - Token mang payload: `{ sub: userId, email: user.email, role: user.role }`.
   - Mỗi request có Bearer token sẽ tự động được kiểm tra và query người dùng trong DB (kiểm tra cả `isActive: true` và `isDeleted: false`).
3. **Phân quyền dựa trên Role (RBAC):**
   - `@Roles(UserRole.ADMIN)` kết hợp cùng `RolesGuard`.
   - Khách hàng có token hợp lệ nhưng role là `customer` khi gọi endpoint admin sẽ bị chặn ngay lập tức với lỗi `403 Forbidden`.
4. **Input Validation:**
   - Tự động kiểm tra định dạng email hợp lệ, độ dài mật khẩu $\ge$ 6 ký tự, loại bỏ các trường không nằm trong DTO (`whitelist: true`).

---

## 4. Kết quả Test tự động (10/10 Passed)

Chạy lệnh: `npm run test:auth`

```text
▶ Test 1: Register new customer (hoang@audiophile.vn)   -> Status: 201 Created (Token + Profile)
▶ Test 2: Register with duplicate email                 -> Status: 409 Conflict
▶ Test 3: Register with short password (< 6 chars)     -> Status: 400 Bad Request
▶ Test 4: Login with valid credentials                 -> Status: 200 OK (Received Token)
▶ Test 5: Login with wrong password                    -> Status: 401 Unauthorized
▶ Test 6: Access GET /auth/me without token            -> Status: 401 Unauthorized
▶ Test 7: Access GET /auth/me with Bearer token        -> Status: 200 OK
▶ Test 8: Customer accesses /auth/admin-check          -> Status: 403 Forbidden (Blocked by RolesGuard)
▶ Test 9: Login as seeded Admin (admin@lossless.shop)  -> Status: 200 OK (Admin Token)
▶ Test 10: Admin accesses /auth/admin-check            -> Status: 200 OK (Full Admin Access)
```

---

## 5. Checkpoint chuyển giao

- [x] Users Module + Users Service hoàn tất
- [x] Auth Module + Auth Service + Auth Controller hoàn tất
- [x] RegisterDto + LoginDto + Validation Pipe
- [x] JwtStrategy + JwtAuthGuard
- [x] RolesGuard + @Roles decorator
- [x] @CurrentUser decorator
- [x] Đã kiểm tra 10 kịch bản test thành công 100%

**➡️ Sẵn sàng cho Lab 3: Quản lý Sản phẩm (Catalog & Product Management - CRUD, lọc theo Audiophile specs, tìm kiếm text index, upload ảnh)**
