import axios from "axios";

function normalizeUrl(url) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

let API_BASE =
  normalizeUrl(import.meta.env.VITE_API_URL) ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://smartdine-backend-production-3dc2.up.railway.app");

// Strip trailing /api if accidentally set in VITE_API_URL (backend has no /api prefix)
if (API_BASE && API_BASE.endsWith("/api")) {
  API_BASE = API_BASE.slice(0, -4);
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

function normalizeRequestUrl(url) {
  if (!url) return url;

  // If the request string is missing a leading slash, make it absolute to baseURL.
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
    url = `/${url}`;
  }

  // If the URL accidentally includes the hostname as a path segment, strip it.
  const match = url.match(/^\/+(?:https?:\/\/)?([^/]+)(\/.*)$/i);
  if (match && match[1].includes("railway.app")) {
    return match[2];
  }

  return url;
}

// Gắn token nếu có và chuẩn hóa url request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartdine_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.url) {
    config.url = normalizeRequestUrl(config.url);
  }
  // Ensure baseURL is always present in production.
  if (!config.baseURL) {
    config.baseURL = API_BASE;
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
