# SmartDine - Hệ thống Quản lý Nhà hàng Thông minh

> Nền tảng quản lý nhà hàng hiện đại – tối ưu quy trình từ đặt bàn, gọi món đến thanh toán.

## 1. Tổng quan

SmartDine được thiết kế để tối ưu hóa toàn bộ quy trình phục vụ nhà hàng, hỗ trợ hai giao diện chính:

- **Admin** – Dành cho nhân viên và quản lý (Dashboard, quản lý đơn hàng, thực đơn, hóa đơn).
- **Customer** – Dành cho khách hàng tự đặt món qua QR Code ngay tại bàn.

**Mục tiêu chính:**

- Tăng hiệu suất phục vụ, giảm sai sót khi gọi món.
- Trải nghiệm "premium" với giao diện hiện đại (Glassmorphism).
- Cập nhật trạng thái đơn hàng và bàn theo thời gian thực qua WebSocket.

## 2. Kiến trúc Kỹ thuật

| Lớp              | Công nghệ                                  |
| ---------------- | ------------------------------------------ |
| **Frontend**     | React + Vite                               |
| **Styling**      | Tailwind CSS, Shadcn UI (Glassmorphism)    |
| **Backend**      | Node.js + Express                          |
| **Database**     | MongoDB + Mongoose                         |
| **Realtime**     | Socket.IO                                  |
| **Icons**        | Lucide React                               |

## 3. Cấu trúc Monorepo

```
SmartDine/
├── frontend/          # Vite + React + Tailwind + React Router + Axios + Socket.IO client
├── backend/           # Express + MongoDB + Mongoose + Socket.IO server
├── package.json       # Root scripts (concurrently)
└── README.md
```

## 4. Cài đặt & Chạy

### Yêu cầu

- Node.js >= 18
- MongoDB (local hoặc Atlas)

### Cài đặt

```bash
# Cài đặt dependencies cho cả frontend và backend
npm install
```

### Biến môi trường

Backend cần file `.env`. Có thể sao chép từ mẫu:

```bash
cp backend/.env.example backend/.env
```

Chỉnh sửa `backend/.env` với thông tin kết nối MongoDB và các khóa cần thiết.

### Khởi chạy

```bash
npm run dev            # Chạy đồng thời frontend + backend
npm run dev:backend    # Chỉ chạy backend (http://localhost:3000)
npm run dev:frontend   # Chỉ chạy frontend (http://localhost:5173)
```

## 5. Mô hình Dữ liệu

### Tables (Bàn)
- `id`, `number`, `status` (`available` / `occupied` / `reserved`), `currentSessionId`

### Menu & Categories (Thực đơn & Danh mục)
- **Category:** `id`, `name`, `order`
- **MenuItem:** `name`, `price`, `description`, `image`, `isAvailable`, `aiDescription`, `upsellSuggestion`

### Session & Orders (Phiên phục vụ & Đơn hàng)
- **Session:** Theo dõi một lượt phục vụ từ khi mở bàn đến khi đóng bill.
- **Order:** Một lần gọi món trong Session. Trạng thái: `pending` → `confirmed` → `completed` / `cancelled`.
- **OrderItem:** Chi tiết món trong đơn, trạng thái riêng: `preparing` / `served`.

## 6. Các Phân hệ Chính

### Admin
- **Dashboard** – Tổng quan doanh thu, trạng thái bàn, đơn hàng gần đây.
- **Quản lý Đơn hàng** – Tiếp nhận, xác nhận đơn. Phân tab: Chờ xác nhận → Đang xử lý → Hoàn thành.
- **Quản lý Thực đơn** – CRUD món ăn. Tích hợp AI tạo mô tả và gợi ý upsell.
- **Quản lý Hóa đơn** – Lịch sử thanh toán, chi tiết hóa đơn, báo cáo doanh thu.
- **Thông báo thời gian thực** – Cảnh báo khi có đơn mới hoặc yêu cầu từ bàn.

### Customer
- **Menu kỹ thuật số** – Duyệt món theo danh mục, hình ảnh, mô tả sinh động.
- **Giỏ hàng & Đặt món** – Thêm món, tùy chỉnh số lượng, gửi đơn đến bếp.
- **Theo dõi đơn hàng** – Timeline trạng thái: Đã nhận → Đang chuẩn bị → Sắp xong → Đã phục vụ.
- **Gọi nhân viên / Thanh toán** – Nút hỗ trợ nhanh tại bàn.

## 7. Hệ thống Thiết kế (Design System)

Phong cách **Premium Dark Mode + Glassmorphism**:

- **Nền** – Animated Gradient chuyển động tinh tế.
- **Thẻ (Cards)** – Lớp phủ kính với `backdrop-blur`, viền trắng nhẹ.
- **Tương tác** – Micro-animations: pulse, hover effects.
- **Màu sắc chủ đạo:**
  - `Primary` (cam/vàng) – Điểm nhấn thương hiệu.
  - `Emerald` (xanh lục) – Thanh toán / thành công.
  - `Rose` (hồng đỏ) – Hủy đơn / cảnh báo.

## 8. Luồng Người dùng

1. Khách quét mã QR tại bàn → truy cập trang đặt món.
2. Chọn món → gửi đơn → hiển thị ngay trên giao diện Admin.
3. Admin xác nhận đơn → Bếp chuẩn bị → Khách thấy tiến độ cập nhật real-time.
4. Admin phục vụ món → đánh dấu hoàn thành.
5. Khách yêu cầu tính tiền → Admin đóng Session → in hóa đơn, giải phóng bàn.

## 9. Yêu cầu Phi chức năng

- **Routing:** Clean URL cho cả Admin và Customer.
- **Responsive:** Hoạt động tốt trên Mobile (Customer) và Desktop/Tablet (Admin).
- **Bảo mật:** Xác thực và phân quyền theo role (Admin / Customer).

## 10. License

[Chưa xác định]
