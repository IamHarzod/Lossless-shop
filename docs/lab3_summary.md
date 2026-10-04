# Lab 3 — Quản lý Danh mục & Sản phẩm Audiophile (Catalog & Products Management) + Upload Ảnh

> **Status:** ✅ COMPLETED & COMPILED (0 errors)  
> **Stack:** NestJS + Mongoose (populate, text index, compound filters) + Multer + Express Static + Passport JWT Guards

---

## 1. Cấu trúc thư mục mới tạo trong Lab 3

```text
backend/
├── src/
│   ├── common/
│   │   └── utils/
│   │       └── slugify.util.ts          ← Tạo slug tự động chuẩn tiếng Việt có dấu
│   ├── modules/
│   │   ├── categories/
│   │   │   ├── dto/
│   │   │   │   ├── create-category.dto.ts
│   │   │   │   └── update-category.dto.ts
│   │   │   ├── categories.service.ts    ← CRUD danh mục, tự tạo slug, soft delete
│   │   │   ├── categories.controller.ts ← 5 Endpoints (Public & Admin)
│   │   │   ├── categories.module.ts
│   │   │   └── index.ts
│   │   ├── products/
│   │   │   ├── dto/
│   │   │   │   ├── audio-specs.dto.ts   ← Sub-dto đặc thù thông số âm thanh Audiophile
│   │   │   │   ├── create-product.dto.ts
│   │   │   │   ├── update-product.dto.ts
│   │   │   │   └── product-query.dto.ts ← DTO lọc đa chiều, tìm kiếm, phân trang, sort
│   │   │   ├── products.service.ts      ← Logic lọc Audiophile specs, tìm kiếm, populate
│   │   │   ├── products.controller.ts   ← 6 Endpoints (Public & Admin)
│   │   │   ├── products.module.ts
│   │   │   └── index.ts
│   │   └── upload/
│   │       ├── upload.service.ts        ← Cấu hình Multer diskStorage, validate mime
│   │       ├── upload.controller.ts     ← Upload 1 ảnh hoặc nhiều ảnh (tối đa 5 ảnh)
│   │       ├── upload.module.ts
│   │       └── index.ts
│   ├── app.module.ts                    ← Tích hợp CategoriesModule, ProductsModule, UploadModule
│   └── main.ts                          ← Cấu hình phục vụ file tĩnh /uploads
└── test/
    └── test-catalog.ts                  ← Test suite tự động 17 test cases cho Lab 3
```

---

## 2. Chi tiết các Endpoints trong Lab 3

Tất cả các endpoint đều có tiền tố `/api/v1`:

### 📂 A. Danh mục (Categories)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | Lấy danh sách danh mục (mặc định chỉ active) |
| `GET` | `/api/v1/categories/:slug` | Public | Lấy chi tiết danh mục theo slug (e.g. `headphones`) |
| `POST` | `/api/v1/categories` | Admin | Tạo danh mục mới (tự động sinh slug tiếng Việt) |
| `PATCH` | `/api/v1/categories/:id` | Admin | Cập nhật tên, mô tả, ảnh cover danh mục |
| `DELETE` | `/api/v1/categories/:id` | Admin | Xóa mềm danh mục (`isDeleted: true`, `isActive: false`) |

---

### 🎧 B. Sản phẩm (Products)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Public | Lấy danh sách sản phẩm với bộ lọc, tìm kiếm, phân trang và sắp xếp |
| `GET` | `/api/v1/products/featured` | Public | Lấy các sản phẩm nổi bật cho trang chủ |
| `GET` | `/api/v1/products/:idOrSlug`| Public | Lấy chi tiết sản phẩm theo ID hoặc Slug (tự động populate category) |
| `POST` | `/api/v1/products` | Admin | Tạo sản phẩm mới kèm thông số kỹ thuật âm thanh (AudioSpecs) |
| `PATCH` | `/api/v1/products/:id` | Admin | Cập nhật thông tin, giá, thông số, tồn kho |
| `DELETE` | `/api/v1/products/:id` | Admin | Xóa mềm sản phẩm |

#### 🔍 Bộ lọc đa chiều hỗ trợ trên `GET /api/v1/products`:
* **Theo danh mục:** `?category=headphones` (hỗ trợ cả slug và ID)
* **Theo thương hiệu:** `?brand=Sennheiser`
* **Theo khoảng giá:** `?minPrice=5000000&maxPrice=30000000`
* **Theo đánh giá:** `?minRating=4`
* **Còn hàng:** `?inStock=true`
* **Theo thông số Audiophile:**
  * `?driverType=Planar` (hoặc Dynamic, Balanced Armature...)
  * `?connector=3.5mm`
  * `?dacChip=ESS`
* **Tìm kiếm từ khóa:** `?search=Moondrop`
* **Sắp xếp:** `?sort=price:asc`, `price:desc`, `newest`, `rating`, `popular`
* **Phân trang:** `?page=1&limit=10` $\rightarrow$ Trả về metadata: `{ total, page, limit, totalPages, hasNextPage, hasPrevPage }`

---

### 🖼️ C. Tải lên file ảnh (File Upload)
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/upload/image` | Admin | Upload 1 file ảnh sản phẩm (lưu vào `/uploads/products/`) |
| `POST` | `/api/v1/upload/images` | Admin | Upload nhiều ảnh (tối đa 5 ảnh) |
| `GET` | `http://localhost:3000/uploads/...` | Public | Truy cập trực tiếp xem ảnh qua trình duyệt hoặc frontend |

---

## 3. Cách chạy kiểm thử Lab 3

Khi Docker Desktop và MongoDB đang chạy, bạn chỉ cần gõ:
```bash
npm run test:catalog
```
Suite kiểm thử tự động gồm **17 test cases** bao phủ toàn bộ luồng nghiệp vụ danh mục, sản phẩm, bộ lọc audiophile và upload ảnh!
