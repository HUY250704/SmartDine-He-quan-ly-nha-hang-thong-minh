import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Gắn token nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartdine_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Không auto-redirect trên 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem("smartdine_token");
      if (token) {
        localStorage.removeItem("smartdine_token");
        localStorage.removeItem("smartdine_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
