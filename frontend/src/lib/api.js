import axios from "axios";

const API_BASE = "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn token từ localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartdine_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động logout nếu token hết hạn
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("smartdine_token");
      localStorage.removeItem("smartdine_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
