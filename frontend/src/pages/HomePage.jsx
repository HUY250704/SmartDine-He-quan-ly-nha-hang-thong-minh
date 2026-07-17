import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function HomePage() {
  const [status, setStatus] = useState('Checking backend...');
  const [socketStatus, setSocketStatus] = useState('Waiting for socket...');

  useEffect(() => {
    axios.get(`${API_URL}/api/ping`)
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
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold">SmartDine Dashboard</h2>
        <p className="mt-2 text-slate-600">React + Vite + Tailwind + Router + Axios + Socket.IO</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Backend status</p>
          <p className="mt-4 text-xl font-medium text-slate-900">{status}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Socket status</p>
          <p className="mt-4 text-xl font-medium text-slate-900">{socketStatus}</p>
        </div>
      </div>
    </div>
  );
}
