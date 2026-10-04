# Lab 1 — Khởi tạo kiến trúc và Thiết kế Database

> **Status:** ✅ COMPLETED  
> **Stack:** NestJS + TypeScript + MongoDB (Mongoose) + ConfigModule

---

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── schemas/                  ← Mongoose Schemas (Lab 1)
│   │   ├── user.schema.ts
│   │   ├── category.schema.ts
│   │   ├── product.schema.ts
│   │   ├── cart.schema.ts
│   │   ├── order.schema.ts
│   │   └── index.ts              ← Barrel export
│   ├── database/
│   │   └── seed.ts               ← DB Seeder script
│   ├── app.module.ts             ← MongoDB + ConfigModule wired up
│   └── main.ts                   ← ValidationPipe + CORS + /api/v1 prefix
├── .env                          ← Local secrets (gitignored)
├── .env.example                  ← Template for team members
└── .gitignore
```

---

## Schemas được thiết kế

### 1. User (`user.schema.ts`)
| Field | Type | Ghi chú |
|-------|------|---------|
| `fullName` | String | Tên hiển thị |
| `email` | String | Unique, lowercase |
| `password` | String | `select: false` — không trả về khi query |
| `role` | Enum | `customer` \| `admin` |
| `phone` | String | Optional |
| `address` | Object | `{ street, city, district, ward }` |
| `isActive` | Boolean | Tắt/bật tài khoản |
| `isDeleted` | Boolean | **Soft delete** |

### 2. Category (`category.schema.ts`)
| Field | Type | Ghi chú |
|-------|------|---------|
| `name` | String | Unique |
| `slug` | String | URL-friendly, e.g. `headphones` |
| `description` | String | Mô tả danh mục |
| `imageUrl` | String | Ảnh cover |
| `isActive` | Boolean | |
| `isDeleted` | Boolean | **Soft delete** |

**Danh mục mẫu (seeded):** Headphones, IEMs, DACs, Amplifiers, Cables, Accessories

### 3. Product (`product.schema.ts`) ⭐ Schema quan trọng nhất
| Field | Type | Ghi chú |
|-------|------|---------|
| `name` / `slug` | String | Unique |
| `brand` | String | Hãng sản xuất |
| `price` / `salePrice` | Number | Giá gốc / giá sale |
| `category` | ObjectId | Ref → Category |
| `images` | String[] | Mảng URL ảnh |
| `stock` | Number | Số lượng tồn kho |
| `rating` / `reviewCount` | Number | Đánh giá |
| `specs` | **AudioSpecs** | Sub-document đặc thù cho audiophile |
| `tags` | String[] | Cho SEO & lọc |
| `isFeatured` | Boolean | Hiện trên trang chủ |
| `isDeleted` | Boolean | **Soft delete** |

**AudioSpecs sub-document** (cho shop Audiophile):
- `impedance` — Trở kháng (Ω)
- `frequencyResponse` — Dải tần số
- `driverType` — Loại driver (Dynamic/BA/Planar)
- `driverSize` — Kích thước driver
- `sensitivity` — Độ nhạy (dB/mW)
- `thd` — Tổng méo hài
- `connector` — Loại jack cắm
- `dacChip` — Chip DAC (cho sản phẩm DAC/Amp)
- `outputPower`, `snr` — Cho Amplifier/DAC

**Indexes:**
- Text index: `name`, `brand`, `description`, `tags` → Full-text search (Lab 3)
- Compound: `category + isActive + isDeleted`
- Sort: `price`, `rating`, `isFeatured`

### 4. Cart (`cart.schema.ts`)
| Field | Type | Ghi chú |
|-------|------|---------|
| `user` | ObjectId | Null nếu là guest |
| `sessionId` | String | Cho guest cart |
| `items` | CartItem[] | Mảng sản phẩm |
| `totalAmount` | Number | Cache tổng tiền |

**CartItem:** `{ product, quantity, priceSnapshot }` — Lưu giá tại thời điểm thêm vào giỏ

### 5. Order (`order.schema.ts`)
| Field | Type | Ghi chú |
|-------|------|---------|
| `orderCode` | String | Unique, e.g. `LS-20241025-0001` |
| `user` | ObjectId | Ref → User |
| `items` | OrderItem[] | **Snapshot** — không thay đổi dù product bị sửa/xóa |
| `shippingAddress` | ShippingAddress | Snapshot tại thời điểm đặt |
| `subtotal` / `shippingFee` / `totalAmount` | Number | |
| `status` | Enum | `pending → paid → processing → shipped → delivered → cancelled` |
| `paymentMethod` | Enum | `cod, vnpay, momo, stripe` |
| `paymentStatus` | Enum | `pending, paid, failed, refunded` |
| `transactionId` | String | Mã giao dịch từ payment gateway |
| `isDeleted` | Boolean | **Soft delete** — KHÔNG BAO GIỜ xóa đơn hàng |

---

## Cách chạy

### 1. Cài dependencies
```bash
cd backend
npm install
```

### 2. Cấu hình .env
```bash
cp .env.example .env
# Chỉnh MONGODB_URI nếu cần
```

### 3. Chạy development server
```bash
npm run start:dev
# → http://localhost:3000/api/v1
```

### 4. Seed dữ liệu mẫu (cần MongoDB đang chạy)
```bash
npm run seed
# Seeds: 6 categories + 3 products + 1 admin account
# Admin: admin@lossless.shop / Admin@123456
```

---

## Lưu ý thiết kế

> [!IMPORTANT]
> **Soft Delete** được áp dụng cho **tất cả** models. Không bao giờ dùng `deleteOne()` hay `deleteMany()` trực tiếp — thay vào đó set `isDeleted: true`.

> [!TIP]
> **Price Snapshot** trong Cart và Order là kỹ thuật quan trọng: lưu lại giá tại thời điểm mua thay vì query lại Product sau này. Điều này tránh tình huống giá sản phẩm thay đổi làm sai tổng tiền đơn hàng cũ.

> [!NOTE]
> **Text Index** đã được tạo sẵn trên Product schema cho full-text search. Sẽ được dùng trong Lab 3 khi build API tìm kiếm sản phẩm.

---

## Checkpoint trước khi qua Lab 2

- [x] NestJS project scaffolded
- [x] Mongoose + ConfigModule wired
- [x] 5 schemas thiết kế xong (User, Category, Product, Cart, Order)
- [x] `.env` configured
- [x] ValidationPipe + CORS + Global prefix `/api/v1`
- [x] Seed script với dữ liệu mẫu audiophile

**➡️ Lab 2: Authentication (JWT + Passport + bcrypt + Guards)**
