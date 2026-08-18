import { io } from "socket.io-client";

function normalizeUrl(url) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

const SOCKET_URL =
  normalizeUrl(import.meta.env.VITE_SOCKET_URL) ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://smartdine-backend-production-87d1.up.railway.app");

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
