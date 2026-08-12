import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api.js';
import { getSocket } from '@/lib/socket.js';



const typeConfig = {
  assistance: { label: 'Assistance', color: '#ffc174', bg: 'rgba(255,193,116,0.1)', border: 'rgba(255,193,116,0.2)' },
  payment: { label: 'Payment', color: '#56e5a9', bg: 'rgba(86,229,169,0.1)', border: 'rgba(86,229,169,0.2)' },
  question: { label: 'Question', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
};

export default function SupportPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const fetchRequests = () => {
    const params = {};
    if (filter !== 'all') params.status = filter;
    if (typeFilter !== 'all') params.type = typeFilter;

    api
      .get('/support', { params })
      .then((res) => setRequests(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load support requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();

    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-admin');
      setConnected(true);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('support-request', (data) => {
      setRequests((prev) => {
        const exists = prev.find((r) => r._id === data._id);
        if (exists) return prev;
        return [data, ...prev];
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('support-request');
    };
  }, []);

  useEffect(() => {
    if (!loading) fetchRequests();
  }, [filter, typeFilter]);

  const resolve = async (id) => {
    try {
      await api.put('/support/' + id + '/resolve');
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'resolved' } : r))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve request');
    }
  };

  const activeCount = requests.filter((r) => r.status === 'pending').length;
  const filteredRequests = requests;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">Loading support requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <p className="text-error text-sm">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(''); fetchRequests(); }}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold tracking-[-0.01em] text-white">Support Requests</h1>
          <p className="text-on-surface-variant/60 text-sm mt-1">
            {activeCount > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse mr-2" />
                {activeCount} active requests
              </>
            ) : (
              'All requests resolved'
            )}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); setError(''); fetchRequests(); }}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <span className="material-symbols-outlined text-on-surface-variant/80">refresh</span>
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'resolved', label: 'Resolved' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f.key ? 'text-primary' : 'text-on-surface-variant/50 hover:bg-white/5 hover:text-on-surface-variant'}`}
            style={
              filter === f.key
                ? { background: 'rgba(255,193,116,0.1)', border: '1px solid rgba(255,193,116,0.3)' }
                : { border: '1px solid transparent' }
            }
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-60">
              {f.key === 'all'
                ? requests.length
                : requests.filter((r) => r.status === f.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Types' },
          { key: 'assistance', label: 'Assistance' },
          { key: 'payment', label: 'Payment' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${typeFilter === f.key ? 'text-primary' : 'text-on-surface-variant/40 hover:bg-white/5 hover:text-on-surface-variant'}`}
            style={
              typeFilter === f.key
                ? { background: 'rgba(255,193,116,0.08)', border: '1px solid rgba(255,193,116,0.2)' }
                : { border: '1px solid transparent' }
            }
          >
            {f.label}
            <span className="ml-1 text-[10px] opacity-60">
              {f.key === 'all'
                ? requests.length
                : requests.filter((r) => r.type === f.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Connected status */}
      <div
        className="mb-6 px-6 py-4 rounded-2xl flex items-center gap-3"
        style={{
          backdropFilter: 'blur(16px)',
          background: connected ? 'rgba(86,229,169,0.08)' : 'rgba(255,180,171,0.08)',
          border: connected ? '1px solid rgba(86,229,169,0.2)' : '1px solid rgba(255,180,171,0.2)',
        }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: connected ? '#56e5a9' : '#ffb4ab' }}
        />
        <div>
          <p className="text-white text-sm font-semibold">
            {connected ? 'Support System Active' : 'Connecting...'}
          </p>
          <p className="text-on-surface-variant/50 text-xs">
            {connected
              ? 'Socket connected \u2013 real-time listening for customer requests'
              : 'Attempting to connect to socket server'}
          </p>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">support_agent</span>
          <p className="text-white font-bold text-lg mb-1">No Support Requests</p>
          <p className="text-on-surface-variant/40 text-sm">
            Customer support requests from tables will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const tc = typeConfig[req.type] || typeConfig.assistance;
            const isResolved = req.status === 'resolved';

            return (
              <div
                key={req._id}
                className="rounded-2xl p-5 flex items-center justify-between transition-all"
                style={{
                  backdropFilter: 'blur(16px)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isResolved ? 'rgba(255,255,255,0.05)' : tc.color + '40'}`,
                  opacity: isResolved ? 0.6 : 1,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isResolved ? 'rgba(255,255,255,0.05)' : tc.color + '20' }}
                  >
                    <span className="material-symbols-outlined" style={{ color: tc.color }}>
                      {req.type === 'payment' ? 'payments' : 'support_agent'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-bold">
                        Table #{req.tableNumber || req.tableId?.number || '?'}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                        style={{ background: tc.bg, borderColor: tc.border, color: tc.color }}
                      >
                        {tc.label}
                      </span>
                      {isResolved && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-on-surface-variant/50">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-sm mt-1">{req.message}</p>
                    <p className="text-on-surface-variant/30 text-xs mt-0.5">
                      {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!isResolved && (
                  <button
                    onClick={() => resolve(req._id)}
                    className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-all flex-shrink-0"
                    style={{ background: tc.color + '20', border: `1px solid ${tc.color}40`, color: tc.color }}
                  >
                    <span className="material-symbols-outlined text-sm">check</span>Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

