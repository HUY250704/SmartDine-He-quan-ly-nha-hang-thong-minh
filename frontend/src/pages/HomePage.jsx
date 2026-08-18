import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function normalizeUrl(url) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

const API_URL =
  normalizeUrl(import.meta.env.VITE_API_URL) ||
  (import.meta.env.MODE === 'development'
    ? 'http://localhost:4000'
    : 'https://smartdine-backend-production-87d1.up.railway.app');

export default function HomePage() {
  const [status, setStatus] = useState('Checking backend...');
  const [socketStatus, setSocketStatus] = useState('Waiting for socket...');

  useEffect(() => {
    axios.get(`${API_URL}/ping`)
      .then((res) => setStatus(res.data.message || 'Backend reachable'))
      .catch(() => setStatus('Backend unreachable'));

    const socket = io(API_URL);
    socket.on('connect', () => setSocketStatus('Socket connected'));
    socket.on('server-message', (payload) => setSocketStatus(payload.message));
    socket.on('disconnect', () => setSocketStatus('Socket disconnected'));

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6 rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div>
        <h2 className="text-2xl font-bold text-white">SmartDine Dashboard</h2>
        <p className="mt-2 text-on-surface-variant/60">React + Vite + Tailwind + Router + Axios + Socket.IO</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm text-on-surface-variant/50">Backend status</p>
          <p className="mt-4 text-xl font-medium text-white">{status}</p>
        </div>
        <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm text-on-surface-variant/50">Socket status</p>
          <p className="mt-4 text-xl font-medium text-white">{socketStatus}</p>
        </div>
      </div>
    </div>
  );
}
