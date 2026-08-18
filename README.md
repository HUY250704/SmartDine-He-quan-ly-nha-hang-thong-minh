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
| **Thanh toán** | Stripe (PaymentIntent + Webhook) + offline cash/e-wallet/bank |
| **Auth (Admin)** | JWT (`jsonwebtoken`) |
| **AI** | Google Gemini API |
| **Upload ảnh** | Cloudinary |
| **Icons** | Google Material Symbols Outlined |
| **API Docs** | Swagger UI (tùy chọn, /api-docs) |

---

## 3. Cấu trúc Monorepo

```
SmartDine/
├── frontend/                    # Vite + React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/          # AdminLayout, UserLayout, ProtectedRoute
│   │   ├── context/             # AuthContext, CartContext, LanguageContext
│   │   ├── lib/                 # api.js (axios), socket.js, price.js, notify.js, dishImages.js
│   │   ├── pages/
│   │   │   ├── admin/           # Dashboard, Orders, Menu, Tables, Bills, Support
│   │   │   └── user/            # Welcome, Menu, Cart, Tracking, Support/Payment, BillSuccess
│   │   └── index.css            # Design tokens + glassmorphism utilities
│   └── index.html
├── backend/
│   ├── src/
│   │   ├── config/              # stripe.js, swagger.js, cloudinary.js, upload.js
│   │   ├── controllers/         # Business logic
│   │   ├── middleware/          # auth.js (JWT verify)
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # Express routers
│   │   ├── socket/              # Socket.IO init + event emitters
│   │   ├── services/            # geminiService.js
│   │   ├── utils/               # batchHelpers.js
│   │   └── index.js             # Entry point
│   └── .env
├── package.json                 # Root (chỉ khai báo stripe hiện tại)
└── README.md
```
## 4. Cài đặt & Chạy

### Yêu cầu

- **Node.js** >= 18
- **MongoDB** (local hoặc Atlas)

### Cài đặt

Dự án gồm hai workspace riêng, cài dependency cho từng workspace:

```bash
cd frontend
npm install

cd ../backend
npm install
```

### Biến môi trường

Tạo file `backend/.env` (có thể tham khảo `backend/.env.example`):

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/smartdine
JWT_SECRET=your-jwt-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Cloudinary (upload ảnh)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI (tạo mô tả/upsell món)
GEMINI_API_KEYS=your_key1,your_key2
GEMINI_FALLBACK_API_KEYS=
GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
SWAGGER_ENABLED=true
```

Tạo `frontend/.env` hoặc dùng `frontend/.env.development`:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Khởi chạy

Backend mặc định chạy ở `http://localhost:4000`:

```bash
cd backend
npm run dev        # nodemon, port 4000
```

Frontend Vite mặc định chạy ở `http://localhost:3000` (xem `frontend/vite.config.js`):

```bash
cd frontend
npm run dev
```

> Ghi chú: thư mục gốc không còn dùng script `concurrently` như tài liệu cũ; chạy riêng hai workspace như trên để đúng cấu hình hiện tại.
## 5. Mô hình Dữ liệu (9 collections)

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
| `price` | Number | Giá (VND) |
| `description` | String | Mô tả |
| `image` | String | URL ảnh |
| `categoryId` | ObjectId → Category | Danh mục |
| `isAvailable` | Boolean | Còn hàng / hết hàng (hỗ trợ lọc trong Admin) |
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
1. Khách quét QR tại bàn
   → Truy cập /customer/:tableId

2. WelcomePage tự mở/khôi phục phiên
   GET /sessions/table/:tableId/active
   ├─ Có session ACTIVE → dùng lại sessionId
   └─ Không có → POST /sessions/open → tạo mới
   → Lưu smartdine_sessionId vào localStorage
   → Bàn chuyển OCCUPIED
   → Socket emit table-updated đến admin

3. Khách xem menu, chọn món và đặt hàng
   GET /menu, GET /categories
   → Modal chi tiết món cho phép chọn số lượng + ghi chú ngay
   → CartContext lưu giỏ vào localStorage
   → CartPage: POST /orders { sessionId, items[] }
   → Backend tạo Order + OrderItems, cộng session.totalAmount
   → Socket emit new-order → Admin nhận đơn và phát âm thanh

4. Khách theo dõi đơn
   GET /orders/session/:sessionId
   Socket join-session → nhận order-updated
   Timeline: PENDING → CONFIRMED → PREPARING → READY → SERVED

5. Gọi nhân viên / yêu cầu hỗ trợ
   POST /support/call { tableId, message, type }
   → Socket emit support-request → Admin nhận và phát âm thanh
```

#### Thanh toán theo phương thức (đúng luồng thực tế)

| Phương thức | Luồng | Kết quả |
|---|---|---|
| **CASH** | `POST /support/payment` → nhân viên kiểm tra → `POST /bills/generate` chọn CASH | Tạo bill `PENDING`, giữ session mở. Bàn chỉ trống khi nhân viên tự đổi trạng thái tay. |
| **E_WALLET** | Hiện QR ngân hàng tĩnh `/qr-bank.png` → khách bấm “Đã thanh toán” → `POST /support/payment` → nhân viên kiểm tra | Tạo bill `PENDING`, giữ session mở. Bàn chỉ trống khi nhân viên đổi trạng thái tay. |
| **BANK_TRANSFER** | Giống E_WALLET: hiện QR tĩnh → gửi yêu cầu → nhân viên xác nhận | Tạo bill `PENDING`, giữ session mở. |
| **CARD (Stripe)** | `POST /bills/create-payment-intent` → Stripe Elements → `POST /bills/confirm-stripe-payment` | Thanh toán thành công thì tự tạo bill `PAID`, đóng session, bàn chuyển `CLEANING`. |
| **Webhook Stripe** | `POST /webhooks/stripe` | Fallback tạo bill `PAID` nếu client mất kết nối. |

> Không còn luồng “E_WALLET/BANK_TRANSFER tạo bill + đóng session ngay”. Các phương thức offline đều chờ nhân viên xác nhận.

### B. Luồng Admin (cần đăng nhập JWT)

```
1. Đăng nhập /login
   → JWT lưu vào localStorage (smartdine_token)

2. Dashboard /admin/dashboard
   GET /dashboard/stats
   GET /dashboard/recent-orders
   GET /dashboard/top-items
   GET /dashboard/revenue-chart?period=week|month
   WebSocket join-admin → tự refresh khi new-order / order-updated / table-updated

3. Quản lý Đơn hàng /admin/orders
   GET /orders
   PUT /orders/:id/status
   Socket new-order → thêm đơn, banner + âm thanh cảnh báo

4. Quản lý Bàn /admin/tables
   GET /tables, POST /tables, PUT /tables/:id, DELETE /tables/:id
   “Close & Generate Bill” → POST /bills/generate
   → Với CASH/E_WALLET/BANK_TRANSFER: tạo bill PENDING, không tự đóng session/giải phóng bàn
   → Nhân viên đổi trạng thái bàn thủ công để về trống

5. Quản lý Thực đơn /admin/menu
   CRUD MenuItem + upload ảnh + AI mô tả/upsell
   Lọc theo danh mục và trạng thái Còn hàng / Hết hàng

6. Hóa đơn /admin/bills
   GET /bills, GET /bills/:id, GET /bills/stats/revenue
   Xem chi tiết bill: danh sách món, số lượng, đơn giá, thành tiền
   In hóa đơn (window.print) + Xuất PDF (cửa sổ in/save PDF)

7. Hỗ trợ /admin/support
   GET /support, PUT /support/:id/resolve
   Socket support-request → phát âm thanh khi có yêu cầu mới
```## 7. API Routes & Auth

### Route nào cần auth (Admin JWT)?

| Route | Auth? |
|---|---|
| `GET /tables`, `POST /tables`, `PUT /tables/:id`, `DELETE /tables/:id` | ✅ |
| `GET /orders`, `PUT /orders/:id/status` | ✅ |
| `GET /bills`, `GET /bills/stats/revenue`, `GET /bills/:id` | ✅ |
| `POST /sessions/close` | ✅ |
| `GET /support`, `PUT /support/:id/resolve` | ✅ |
| `GET /dashboard/*` | ✅ |
| `POST /menu`, `PUT /menu/:id`, `DELETE /menu/:id`, `POST /menu/upload` | ✅ |

### Route nào PUBLIC (Customer)?

| Route | Ghi chú |
|---|---|
| `GET /tables/public` | Danh sách bàn (cho khách đổi bàn) |
| `POST /sessions/open` | Mở phiên khi quét QR |
| `POST /sessions/switch` | Khách đổi bàn |
| `GET /sessions/table/:id/active` | Kiểm tra session hiện tại |
| `GET /menu`, `GET /categories` | Xem thực đơn |
| `POST /orders` | Khách đặt món |
| `GET /orders/session/:id` | Khách theo dõi đơn |
| `POST /support/call`, `POST /support/payment` | Gọi nhân viên / yêu cầu thanh toán |
| `POST /bills/generate` | Tạo hóa đơn offline (chờ nhân viên xác nhận) |
| `POST /bills/create-payment-intent` | Stripe PaymentIntent |
| `POST /bills/confirm-stripe-payment` | Xác nhận thanh toán Stripe |

> **Cơ chế xác thực customer**: Không dùng JWT. Controller validate bằng `sessionId`/`tableId` (session phải tồn tại và đang `ACTIVE`). Token JWT chỉ dành cho admin.
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
| `join-admin` | Client → Server | Admin join room "admin" |
| `join-session` | Client → Server | Customer join room `session:{id}` |
| `join-table` | Client → Server | Join room `table:{id}` |
| `new-order` | Server → admin + session | Có đơn mới từ khách (admin phát âm thanh) |
| `order-updated` | Server → admin + session | Trạng thái đơn thay đổi |
| `support-request` | Server → admin | Khách gọi nhân viên / yêu cầu thanh toán (admin phát âm thanh) |
| `table-updated` | Server → admin + table | Trạng thái bàn thay đổi |

> Dashboard cũng lắng nghe `new-order`, `order-updated`, `table-updated` để tự refresh mà không cần bấm làm mới.
## 10. Thanh toán & Xuất hóa đơn

### Thẻ tín dụng (Stripe)

```
Khách chọn Credit Card
  → POST /bills/create-payment-intent
  → Backend tính total = subtotal + 8% tax + 5% service
  → Stripe PaymentIntent → trả clientSecret
  → Stripe Elements hiển thị form thẻ
  → Khách submit → frontend gọi confirmStripePayment
  → Backend verify PaymentIntent → tạo Bill PAID → đóng Session → bàn CLEANING
  → Fallback: Stripe Webhook /webhooks/stripe
```

### Tiền mặt / Ví điện tử / Chuyển khoản

```
Khách chọn CASH → gửi yêu cầu thanh toán
  → POST /support/payment
  → Admin nhận yêu cầu tại /admin/support hoặc /admin/tables
  → Nhân viên chọn Close & Generate Bill → POST /bills/generate
  → Tạo Bill PENDING, session vẫn mở
  → Bàn chỉ chuyển trạng thái khi nhân viên đổi trạng thái thủ công

Khách chọn E_WALLET / BANK_TRANSFER
  → Hiện QR ngân hàng tĩnh /qr-bank.png
  → Khách bấm Đã thanh toán → POST /support/payment
  → Nhân viên kiểm tra giao dịch → xác nhận tạo bill
```

### Hóa đơn (Admin)

- Modal chi tiết hiển thị: tên món, số lượng, đơn giá, thành tiền, thuế, phí dịch vụ, tổng cộng.
- Nút **In hóa đơn** gọi `window.print()`.
- Nút **Xuất PDF** mở cửa sổ in chuẩn hoá đơn để người dùng chọn Save as PDF; không cần thư viện PDF bên thứ ba.
## 11. Yêu cầu Phi chức năng

- **Routing:** Clean URL — `/admin/*` cho dashboard, `/customer/:tableId/*` cho khách.
- **Responsive:** Mobile-first cho customer, desktop/tablet cho admin.
- **Bảo mật:**
  - JWT cho toàn bộ admin API (middleware `auth.js`).
  - Customer flow dùng session-based validation trong controller.
  - `.env` chứa tất cả secret/key.
  - Stripe webhook signature verification.
- **Real-time:** Socket.IO — admin nhận đơn mới, yêu cầu hỗ trợ ngay lập tức; customer thấy tiến độ món ăn.
- **Cảnh báo:** Admin có âm thanh cho đơn mới và yêu cầu hỗ trợ; banner cho đơn mới.
- **Error handling:** Response interceptor tự động logout admin khi token hết hạn (401).
## 12. License

[Chưa xác định]
