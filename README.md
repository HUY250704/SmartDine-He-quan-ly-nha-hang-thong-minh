# SmartDine - Hệ thống Quản lý Nhà hàng Thông minh

> Nền tảng quản lý nhà hàng hiện đại — tối ưu toàn bộ quy trình từ đặt bàn, gọi món đến thanh toán, dành cho cả nhân viên và khách hàng.

---

## 1. Tổng quan

SmartDine gồm **hai giao diện** phục vụ hai nhóm người dùng hoàn toàn tách biệt:

| Giao diện | Đối tượng | Cách truy cập |
|---|---|---|
| **Admin Dashboard** | Nhân viên / Quản lý nhà hàng | Đăng nhập qua `/login`, quản lý tại `/admin/*` |
| **Customer App** | Khách hàng tại bàn | Quét mã QR, vào thẳng `/customer/:tableId` *(không cần đăng nhập)* |

**Mục tiêu chính:**
- Tăng tốc độ phục vụ, giảm sai sót khi gọi món.
- Trải nghiệm "premium" với giao diện Glassmorphism dark mode.
- Cập nhật trạng thái đơn hàng & bàn theo **thời gian thực** qua WebSocket (Socket.IO).

---

## 2. Kiến trúc Công nghệ

| Lớp | Công nghệ |
|---|---|
| **Frontend** | React 18 + Vite |
| **Styling** | Tailwind CSS + CSS custom properties (Glassmorphism dark theme) |
| **Backend** | Node.js + Express |
| **Database** | MongoDB + Mongoose ODM |
| **Realtime** | Socket.IO |
| **Thanh toán** | Stripe (PaymentIntent + Webhook) |
| **Auth (Admin)** | JWT (`jsonwebtoken`) |
| **Icons** | Google Material Symbols Outlined |
| **API Docs** | Swagger UI (tùy chọn, `/api-docs`) |

---

## 3. Cấu trúc Monorepo

```
SmartDine/
├── frontend/                    # Vite + React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/          # AdminLayout, UserLayout, ProtectedRoute
│   │   ├── context/             # AuthContext, CartContext, LanguageContext
│   │   ├── lib/                 # api.js (axios), socket.js, price.js, dishImages.js
│   │   ├── pages/
│   │   │   ├── admin/           # 7 admin pages
│   │   │   └── user/            # 6 customer pages
│   │   └── index.css            # Design tokens + glassmorphism utilities
│   └── index.html
├── backend/
│   ├── src/
│   │   ├── config/              # stripe.js, swagger.js
│   │   ├── controllers/         # Business logic (9 controllers)
│   │   ├── middleware/           # auth.js (JWT verify)
│   │   ├── models/              # Mongoose schemas (10 models)
│   │   ├── routes/              # Express routers (9 route files)
│   │   ├── socket/              # Socket.IO init + event emitters
│   │   ├── utils/               # batchHelpers.js
│   │   └── index.js             # Entry point
│   └── .env
├── package.json                 # Root scripts (concurrently)
└── README.md
```

---

## 4. Cài đặt & Chạy

### Yêu cầu

- **Node.js** >= 18
- **MongoDB** (local hoặc Atlas)

### Cài đặt

```bash
npm install
```

### Biến môi trường

Tạo file `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ALLOWED_ORIGINS=http://localhost:5173
SWAGGER_ENABLED=true                # optional
```

Frontend cần file `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Khởi chạy

```bash
npm run dev             # Chạy đồng thời frontend (5173) + backend (5000)
npm run dev:backend     # Chỉ backend
npm run dev:frontend    # Chỉ frontend
```

---

## 5. Mô hình Dữ liệu (10 collections)

### Table (Bàn)
| Field | Type | Ghi chú |
|---|---|---|
| `number` | Number | Số bàn (unique) |
| `status` | Enum | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING` |
| `capacity` | Number | Sức chứa (mặc định 4) |
| `zone` | String | Khu vực (Main Hall, VIP Terrace...) |
| `currentSessionId` | ObjectId → Session | Phiên đang hoạt động |

### Session (Phiên phục vụ)
| Field | Type | Ghi chú |
|---|---|---|
| `tableId` | ObjectId → Table | Bàn được phục vụ |
| `status` | Enum | `ACTIVE`, `CLOSED` |
| `startTime` | Date | Thời gian mở phiên |
| `endTime` | Date | Thời gian đóng phiên |
| `totalAmount` | Number | Tổng tiền orders trong phiên |

### Order (Đơn hàng)
| Field | Type | Ghi chú |
|---|---|---|
| `sessionId` | ObjectId → Session | Thuộc phiên nào |
| `status` | Enum | `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `SERVED` / `CANCELLED` |
| `createdAt` | Date | Thời gian tạo đơn |

### OrderItem (Chi tiết món trong đơn)
| Field | Type |
|---|---|
| `orderId` | ObjectId → Order |
| `menuItemId` | ObjectId → MenuItem |
| `quantity` | Number |
| `note` | String (ghi chú món) |
| `status` | Enum (đồng bộ với Order) |

### MenuItem (Món ăn)
| Field | Type | Ghi chú |
|---|---|---|
| `name` | String | Tên món |
| `price` | Number | Giá (USD) |
| `description` | String | Mô tả |
| `image` | String | URL ảnh |
| `categoryId` | ObjectId → Category | Danh mục |
| `isAvailable` | Boolean | Còn món không |
| `popular` | Boolean | Đánh dấu phổ biến |
| `aiDescription` | String | Mô tả sinh bởi AI (tùy chọn) |

### Category (Danh mục món)
| Field | Type |
|---|---|
| `name` | String |
| `order` | Number (thứ tự hiển thị) |

### Bill (Hóa đơn)
| Field | Type | Ghi chú |
|---|---|---|
| `sessionId` | ObjectId → Session | Unique index |
| `items` | Array | `[{ name, quantity, price, image }]` |
| `subtotal` | Number | Tổng trước thuế |
| `tax` | Number | 8% |
| `serviceCharge` | Number | 5% |
| `total` | Number | Tổng cộng |
| `paymentMethod` | Enum | `CASH`, `CARD`, `E_WALLET`, `BANK_TRANSFER` |
| `paymentStatus` | Enum | `PENDING`, `PAID` |
| `stripePaymentIntentId` | String | Nếu thanh toán qua Stripe |

### SupportRequest (Yêu cầu hỗ trợ)
| Field | Type |
|---|---|
| `tableId` | ObjectId → Table |
| `sessionId` | ObjectId → Session |
| `type` | `assistance` / `payment` |
| `message` | String |
| `status` | `pending` / `resolved` |

### User (Nhân viên — Admin)
| Field | Type |
|---|---|
| `username` | String (unique) |
| `password` | String (bcrypt hash) |
| `role` | Enum: `ADMIN`, `STAFF` |

---

## 6. Luồng Hoạt động Chi tiết

### A. Luồng Khách hàng (Customer Flow — không cần đăng nhập)

```
┌─────────────────────────────────────────────────────────────┐
│  1. KHÁCH QUÉT QR CODE TẠI BÀN                               │
│     → Truy cập /customer/{tableNumber}                       │
├─────────────────────────────────────────────────────────────┤
│  2. WELCOMEPAGE TỰ ĐỘNG MỞ PHIÊN (SESSION)                   │
│     GET /sessions/table/:tableId/active                      │
│     ├─ Có session ACTIVE → dùng lại sessionId                │
│     └─ Không có → POST /sessions/open → tạo mới              │
│     → Lưu smartdine_sessionId vào localStorage               │
│     → Trạng thái bàn chuyển thành OCCUPIED                   │
│     → WebSocket emit table-updated đến admin                 │
├─────────────────────────────────────────────────────────────┤
│  3. KHÁCH XEM MENU → CHỌN MÓN → ĐẶT HÀNG                     │
│     GET /menu, GET /categories                               │
│     Chọn món → thêm vào CartContext (local state)            │
│     CartPage: POST /orders { sessionId, items[] }            │
│     → Tạo Order + OrderItems                                 │
│     → WebSocket emit new-order → Admin nhận ngay             │
├─────────────────────────────────────────────────────────────┤
│  4. KHÁCH THEO DÕI ĐƠN HÀNG (OrderTrackingPage)             │
│     GET /orders/session/:sessionId                           │
│     WebSocket join-session → nhận real-time order-updated    │
│     Timeline: PENDING → CONFIRMED → PREPARING → READY → SERVED│
├─────────────────────────────────────────────────────────────┤
│  5a. GỌI NHÂN VIÊN (SupportPaymentPage)                      │
│     POST /support/call { tableId, message, type }            │
│     → WebSocket emit support-request → Admin SupportPage     │
│                                                                │
│  5b. THANH TOÁN (4 phương thức)                               │
│     ├─ CASH:         POST /support/payment → Admin xác nhận  │
│     │                POST /bills/generate { method: CASH }   │
│     ├─ CARD (Stripe): POST /bills/create-payment-intent      │
│     │                → Stripe Elements → xác nhận thẻ        │
│     │                POST /bills/confirm-stripe-payment      │
│     ├─ E_WALLET:     POST /bills/generate { method: E_WALLET }│
│     └─ BANK_TRANSFER: POST /bills/generate { method: BANK_TRANSFER }│
│     → Tạo Bill → Session CLOSED → Bàn chuyển CLEANING        │
│     → Redirect BillSuccessPage                                │
└─────────────────────────────────────────────────────────────┘
```

### B. Luồng Admin (cần đăng nhập JWT)

```
┌──────────────────────────────────────────────────────────────┐
│  1. ĐĂNG NHẬP                                                │
│     POST /auth/login { username, password }                  │
│     → JWT token + user → localStorage                        │
│     → ProtectedRoute kiểm tra token → cho vào /admin/*       │
├──────────────────────────────────────────────────────────────┤
│  2. DASHBOARD (/admin/dashboard)                             │
│     GET /dashboard/stats (revenue, orders, tables)           │
│     GET /dashboard/revenue-chart (daily/weekly)              │
│     GET /dashboard/top-items                                 │
│     WebSocket join-admin → nhận real-time updates            │
├──────────────────────────────────────────────────────────────┤
│  3. QUẢN LÝ ĐƠN HÀNG (/admin/orders)                        │
│     GET /orders (tất cả đơn)                                 │
│     PUT /orders/:id/status → cập nhật trạng thái             │
│     WebSocket: new-order, order-updated                      │
├──────────────────────────────────────────────────────────────┤
│  4. QUẢN LÝ BÀN (/admin/tables)                              │
│     GET /tables, POST /tables, PUT /tables/:id,              │
│     DELETE /tables/:id                                       │
│     WebSocket: table-updated (real-time)                     │
│     Hỗ trợ phân khu: All Floors / Main Hall / VIP Terrace    │
├──────────────────────────────────────────────────────────────┤
│  5. QUẢN LÝ MENU (/admin/menu)                               │
│     CRUD MenuItem + Category                                 │
│     POST /menu/public/ai-description (tạo mô tả AI)          │
├──────────────────────────────────────────────────────────────┤
│  6. HÓA ĐƠN (/admin/bills)                                   │
│     GET /bills, GET /bills/:id, GET /bills/stats/revenue     │
├──────────────────────────────────────────────────────────────┤
│  7. HỖ TRỢ (/admin/support)                                  │
│     GET /support (real-time requests từ khách)               │
│     PUT /support/:id/resolve → đánh dấu đã xử lý             │
│     WebSocket: support-request                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. API Routes & Auth

### Route nào cần auth (Admin JWT)?

| Route | Auth? |
|---|---|
| `GET /tables`, `POST /tables`, `PUT /tables/:id`, `DELETE /tables/:id` | ✅ |
| `GET /orders`, `PUT /orders/:id/status` | ✅ |
| `GET /bills`, `GET /bills/stats/revenue`, `GET /bills/:id` | ✅ |
| `POST /sessions/close` | ✅ |
| `GET /support`, `PUT /support/:id/resolve` | ✅ |
| `GET /dashboard/*` | ✅ |

### Route nào PUBLIC (Customer)?

| Route | Ghi chú |
|---|---|
| `POST /sessions/open` | Mở phiên khi quét QR |
| `POST /sessions/switch` | Khách đổi bàn |
| `GET /sessions/table/:id/active` | Kiểm tra session hiện tại |
| `GET /tables/public` | Danh sách bàn (cho đổi bàn) |
| `POST /orders` | Khách đặt món |
| `GET /orders/session/:id` | Khách theo dõi đơn |
| `GET /menu`, `GET /categories` | Xem thực đơn |
| `POST /bills/generate` | Tạo hóa đơn (Cash/E-Wallet/Bank) |
| `POST /bills/create-payment-intent` | Stripe PaymentIntent |
| `POST /bills/confirm-stripe-payment` | Xác nhận thanh toán Stripe |
| `POST /support/call`, `POST /support/payment` | Gọi nhân viên / yêu cầu thanh toán |

> **Cơ chế xác thực customer**: Không dùng JWT. Thay vào đó, controller validate bằng `sessionId` (phải tồn tại + status `ACTIVE`) và `tableId` (phải khớp với session). Token chỉ tồn tại trong localStorage của admin.

---

## 8. Hệ thống Thiết kế (Design System)

**Phong cách: Premium Dark Mode + Glassmorphism**

| Thành phần | Mô tả |
|---|---|
| **Nền** | `#0c1322` (dark navy) + radial gradient tinh tế |
| **Thẻ (Cards)** | `rgba(255,255,255,0.03)` + `backdrop-blur(12px)` + border mờ |
| **Màu chính** | `#ffc174` (ấm, vàng cam) — dùng cho CTA, điểm nhấn |
| **Màu phụ** | `#ffb690` (hồng cam) — orders, occupied |
| **Thành công** | `#56e5a9` (xanh lục) — available, ready, served |
| **Cảnh báo** | `#ffb4ab` (hồng đỏ) — error, cancelled |
| **Văn bản chính** | `#dce2f7` |
| **Văn bản phụ** | `#d8c3ad` / opacity variants |
| **Typography** | Inter (body) + JetBrains Mono (prices/numbers) |
| **Micro-animations** | Pulse, shake, floating, slideUp |
| **Glass utilities** | `.glass-card`, `.glass-btn`, `.glass-input`, `.glass-btn-primary` |

---

## 9. WebSocket Events

| Event | Hướng | Mô tả |
|---|---|---|
| `join-admin` | Client → Server | Admin dashboard join room "admin" |
| `join-session` | Client → Server | Customer join room `session:{id}` |
| `join-table` | Client → Server | Join room `table:{id}` |
| `new-order` | Server → admin + session | Có đơn mới từ khách |
| `order-updated` | Server → admin + session | Admin cập nhật trạng thái đơn |
| `support-request` | Server → admin | Khách gọi nhân viên / yêu cầu thanh toán |
| `table-updated` | Server → admin + table | Trạng thái bàn thay đổi |

---

## 10. Thanh toán Stripe

```
Khách chọn "Credit Card"
  → POST /bills/create-payment-intent
  → Backend tính total (subtotal + 8% tax + 5% service) → Stripe PaymentIntent
  → Trả clientSecret về frontend
  → Stripe Elements hiển thị form nhập thẻ
  → Khách submit → Stripe xử lý → frontend gọi confirmStripePayment
  → Backend verify PaymentIntent với Stripe → tạo Bill → đóng Session → giải phóng bàn
  → (Dự phòng) Stripe Webhook → /webhooks/stripe → auto-tạo Bill nếu client disconnect
```

---

## 11. Yêu cầu Phi chức năng

- **Routing:** Clean URL — `/admin/*` cho dashboard, `/customer/:tableId/*` cho khách.
- **Responsive:** Mobile-first cho customer, desktop/tablet cho admin.
- **Bảo mật:**
  - JWT cho toàn bộ admin API (middleware `auth.js`).
  - Customer flow dùng session-based validation trong controller.
  - `.env` chứa tất cả secret/key.
  - Stripe webhook signature verification.
- **Real-time:** Socket.IO — admin nhận đơn mới, yêu cầu hỗ trợ ngay lập tức; customer thấy tiến độ món ăn.
- **Error handling:** Response interceptor tự động logout admin khi token hết hạn (401).

---

## 12. License

[Chưa xác định]
