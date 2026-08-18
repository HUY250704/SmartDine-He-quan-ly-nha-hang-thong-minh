import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SmartDine API",
      version: "0.1.0",
      description:
        "Hệ thống quản lý nhà hàng thông minh — API đặt món, quản lý bàn, order, bill & dashboard.",
      contact: { name: "SmartDine", url: "https://smartdine.vn" },
    },
    servers: [
      { url: "http://localhost:5000", description: "Local dev" },
      { url: "https://api.smartdine.vn", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [],
    tags: [
      { name: "Auth", description: "Đăng ký / đăng nhập" },
      { name: "Tables", description: "Quản lý bàn" },
      { name: "Categories", description: "Danh mục món" },
      { name: "Menu", description: "Thực đơn & AI" },
      { name: "Sessions", description: "Phiên đặt món" },
      { name: "Orders", description: "Đơn hàng" },
      { name: "Bills", description: "Hóa đơn & doanh thu" },
      { name: "Support", description: "Hỗ trợ khách hàng" },
      { name: "Dashboard", description: "Thống kê" },
    ],
    paths: {
      // ─── AUTH ──────────────────────────────────────────────
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Đăng ký tài khoản",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string", example: "admin" },
                    password: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Tạo tài khoản thành công" },
            400: { description: "Thiếu thông tin / trùng username" },
          },
        },
      },

      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Đăng nhập",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string", example: "admin" },
                    password: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Trả về JWT token" },
            401: { description: "Sai thông tin đăng nhập" },
          },
        },
      },

      "/auth/profile": {
        get: {
          tags: ["Auth"],
          summary: "Lấy thông tin profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Thông tin user" },
            401: { description: "Chưa đăng nhập" },
          },
        },
      },

      // ─── TABLES ────────────────────────────────────────────
      "/tables": {
        get: {
          tags: ["Tables"],
          summary: "Danh sách bàn",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Mảng các bàn" } },
        },
        post: {
          tags: ["Tables"],
          summary: "Thêm bàn mới",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["number"],
                  properties: {
                    number: { type: "integer", example: 5 },
                    capacity: { type: "integer", example: 4 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Bàn đã tạo" } },
        },
      },

      "/tables/{id}": {
        put: {
          tags: ["Tables"],
          summary: "Cập nhật bàn",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    number: { type: "integer", example: 6 },
                    capacity: { type: "integer", example: 6 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Bàn đã cập nhật" } },
        },
        delete: {
          tags: ["Tables"],
          summary: "Xóa bàn",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Bàn đã xóa" } },
        },
      },

      // ─── CATEGORIES ────────────────────────────────────────
      "/categories": {
        get: {
          tags: ["Categories"],
          summary: "Danh sách danh mục",
          responses: { 200: { description: "Mảng danh mục" } },
        },
        post: {
          tags: ["Categories"],
          summary: "Thêm danh mục",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Khai vị" },
                    order: { type: "integer", example: 1 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Danh mục đã tạo" } },
        },
      },

      // ─── MENU ──────────────────────────────────────────────
      "/menu": {
        get: {
          tags: ["Menu"],
          summary: "Danh sách món (public)",
          parameters: [
            { name: "categoryId", in: "query", schema: { type: "string" } },
            { name: "isAvailable", in: "query", schema: { type: "boolean" } },
          ],
          responses: { 200: { description: "Mảng menu items" } },
        },
        post: {
          tags: ["Menu"],
          summary: "Thêm món (có upload ảnh)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["name", "price", "categoryId"],
                  properties: {
                    name: { type: "string", example: "Phở bò" },
                    price: { type: "number", example: 55000 },
                    categoryId: { type: "string" },
                    description: { type: "string" },
                    isAvailable: { type: "boolean" },
                    image: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Món đã tạo" } },
        },
      },

      "/menu/{id}": {
        put: {
          tags: ["Menu"],
          summary: "Cập nhật món",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    isAvailable: { type: "boolean" },
                    image: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Món đã cập nhật" } },
        },
        delete: {
          tags: ["Menu"],
          summary: "Xóa món",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Món đã xóa" } },
        },
      },

      "/menu/upload": {
        post: {
          tags: ["Menu"],
          summary: "Upload ảnh món ăn",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "URL ảnh đã upload" } },
        },
      },

      "/menu/ai-description": {
        post: {
          tags: ["Menu"],
          summary: "Sinh mô tả / upsell bằng Gemini AI",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Phở bò tái" },
                    category: { type: "string", example: "Món chính" },
                    type: {
                      type: "string",
                      enum: ["description", "upsell"],
                      example: "description",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Nội dung AI đã sinh" },
            500: { description: "Lỗi Gemini API" },
          },
        },
      },

      "/menu/public/ai-description": {
        post: {
          tags: ["Menu"],
          summary: "Sinh mô tả AI (public, không cần auth)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Phở bò tái" },
                    category: { type: "string" },
                    type: { type: "string", enum: ["description", "upsell"] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Nội dung AI" } },
        },
      },

      // ─── SESSIONS ──────────────────────────────────────────
      "/sessions/open": {
        post: {
          tags: ["Sessions"],
          summary: "Mở phiên đặt món cho bàn",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tableId"],
                  properties: {
                    tableId: { type: "string" },
                    customerName: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Phiên đã mở" } },
        },
      },

      "/sessions/close": {
        post: {
          tags: ["Sessions"],
          summary: "Đóng phiên đặt món",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sessionId"],
                  properties: { sessionId: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "Phiên đã đóng" } },
        },
      },

      "/sessions/switch": {
        post: {
          tags: ["Sessions"],
          summary: "Chuyển bàn cho phiên",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sessionId", "newTableId"],
                  properties: {
                    sessionId: { type: "string" },
                    newTableId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Đã chuyển bàn" } },
        },
      },

      "/sessions/table/{id}/active": {
        get: {
          tags: ["Sessions"],
          summary: "Lấy phiên active của bàn",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Phiên active hoặc null" } },
        },
      },

      // ─── ORDERS ────────────────────────────────────────────
      "/orders": {
        get: {
          tags: ["Orders"],
          summary: "Tất cả đơn hàng",
          responses: { 200: { description: "Mảng orders" } },
        },
        post: {
          tags: ["Orders"],
          summary: "Tạo đơn hàng mới",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sessionId", "items"],
                  properties: {
                    sessionId: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          menuItemId: { type: "string" },
                          quantity: { type: "integer", example: 1 },
                          note: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Order đã tạo" } },
        },
      },

      "/orders/session/{id}": {
        get: {
          tags: ["Orders"],
          summary: "Đơn hàng theo session",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Mảng orders" } },
        },
      },

      "/orders/{id}/status": {
        put: {
          tags: ["Orders"],
          summary: "Cập nhật trạng thái đơn hàng",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"],
                      example: "CONFIRMED",
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Order đã cập nhật" } },
        },
      },

      // ─── BILLS ─────────────────────────────────────────────
      "/bills": {
        get: {
          tags: ["Bills"],
          summary: "Danh sách hóa đơn",
          responses: { 200: { description: "Mảng bills" } },
        },
      },

      "/bills/generate": {
        post: {
          tags: ["Bills"],
          summary: "Tạo hóa đơn từ session",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sessionId"],
                  properties: { sessionId: { type: "string" } },
                },
              },
            },
          },
          responses: { 201: { description: "Bill đã tạo" } },
        },
      },

      "/bills/stats/revenue": {
        get: {
          tags: ["Bills"],
          summary: "Thống kê doanh thu",
          parameters: [
            { name: "from", in: "query", schema: { type: "string", format: "date" } },
            { name: "to", in: "query", schema: { type: "string", format: "date" } },
          ],
          responses: { 200: { description: "Số liệu doanh thu" } },
        },
      },

      "/bills/{id}": {
        get: {
          tags: ["Bills"],
          summary: "Chi tiết hóa đơn",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Chi tiết bill" } },
        },
      },

      // ─── SUPPORT ───────────────────────────────────────────
      "/support": {
        get: {
          tags: ["Support"],
          summary: "Danh sách yêu cầu hỗ trợ",
          responses: { 200: { description: "Mảng support requests" } },
        },
      },

      "/support/call": {
        post: {
          tags: ["Support"],
          summary: "Gọi nhân viên",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tableId"],
                  properties: {
                    tableId: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Đã gửi yêu cầu" } },
        },
      },

      "/support/payment": {
        post: {
          tags: ["Support"],
          summary: "Yêu cầu thanh toán",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tableId", "sessionId"],
                  properties: {
                    tableId: { type: "string" },
                    sessionId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Đã gửi yêu cầu" } },
        },
      },

      "/support/{id}/resolve": {
        put: {
          tags: ["Support"],
          summary: "Đánh dấu yêu cầu đã xử lý",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Yêu cầu đã resolved" } },
        },
      },

      // ─── DASHBOARD ─────────────────────────────────────────
      "/dashboard/overview": {
        get: {
          tags: ["Dashboard"],
          summary: "Tổng quan dashboard",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Số liệu tổng quan" } },
        },
      },

      "/dashboard/stats": {
        get: {
          tags: ["Dashboard"],
          summary: "Thống kê chi tiết",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Stats" } },
        },
      },

      "/dashboard/revenue": {
        get: {
          tags: ["Dashboard"],
          summary: "Doanh thu",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "period", in: "query", schema: { type: "string", example: "week" } },
          ],
          responses: { 200: { description: "Số liệu doanh thu" } },
        },
      },

      "/dashboard/revenue-chart": {
        get: {
          tags: ["Dashboard"],
          summary: "Dữ liệu biểu đồ doanh thu",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "from", in: "query", schema: { type: "string", format: "date" } },
            { name: "to", in: "query", schema: { type: "string", format: "date" } },
          ],
          responses: { 200: { description: "Dữ liệu chart" } },
        },
      },

      "/dashboard/top-items": {
        get: {
          tags: ["Dashboard"],
          summary: "Top món bán chạy",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Mảng top items" } },
        },
      },

      "/dashboard/recent-orders": {
        get: {
          tags: ["Dashboard"],
          summary: "Đơn hàng gần đây",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Mảng recent orders" } },
        },
      },
    },
  },
  apis: [], // không cần scan file vì đã define toàn bộ paths ở trên
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
