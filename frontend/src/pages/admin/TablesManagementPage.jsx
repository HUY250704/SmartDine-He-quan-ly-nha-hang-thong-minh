import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api.js";
import { GlassCard } from "@/components/ui/glass-card.jsx";
import { useLang } from "@/context/LanguageContext.jsx";
import { getSocket } from "@/lib/socket.js";
import { formatVND } from "@/lib/price.js";

const statusConfig = {
  AVAILABLE: { label: "tables.available", color: "#56e5a9", bg: "rgba(86,229,169,0.1)", border: "rgba(86,229,169,0.2)", icon: "check_circle" },
  OCCUPIED:  { label: "tables.occupied",  color: "#ffb690", bg: "rgba(255,182,144,0.1)", border: "rgba(255,182,144,0.2)", icon: "groups" },
  RESERVED:  { label: "tables.reserved",  color: "#ffc174", bg: "rgba(255,193,116,0.1)", border: "rgba(255,193,116,0.2)", icon: "bookmark" },
  CLEANING:  { label: "tables.cleaning",  color: "#a08e7a", bg: "rgba(160,142,122,0.1)",  border: "rgba(160,142,122,0.2)",  icon: "mop" },
};

const zoneLabels = ["Main Hall", "VIP Lounge", "Window Seat", "Patio", "Corner", "Center"];
const guestCounts = [2, 4, 6, 8, 10, 12];
const floorOptions = ["tables.allFloors", "tables.mainHall", "tables.vipTerrace"];
const floorZoneMap = { "tables.mainHall": "Main Hall", "tables.vipTerrace": "VIP Terrace" };

const paymentMethods = [
  { id: "CASH", label: "Cash", icon: "payments", color: "#60a5fa" },
  { id: "CARD", label: "Card", icon: "credit_card", color: "#ffc174" },
  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: "account_balance", color: "#a78bfa" },
  { id: "E_WALLET", label: "E-Wallet", icon: "wallet", color: "#56e5a9" },
];

export default function TablesManagementPage() {
  const { t } = useLang();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({ number: "", capacity: 4, zone: "Main Hall" });
  const [activeFloor, setActiveFloor] = useState("tables.allFloors");
  const [timers, setTimers] = useState({});
  const timerRef = useRef(null);

  // Session / Bill state
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const fetchTables = () => {
    api.get("/tables")
      .then((res) => {
        setTables(res.data);
        const now = Date.now();
        const newTimers = {};
        res.data.forEach((t) => {
          if (t.status === "OCCUPIED" && t.currentSessionId?.startTime) {
            newTimers[t._id] = Math.floor((now - new Date(t.currentSessionId.startTime).getTime()) / 1000);
          }
        });
        setTimers(newTimers);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load tables"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTables();
    timerRef.current = setInterval(() => {
      setTimers((prev) => {
        const next = {};
        for (const [k, v] of Object.entries(prev)) next[k] = v + 1;
        return next;
      });
    }, 1000);

    const socket = getSocket();
    socket.on("table-updated", fetchTables);
    return () => {
      clearInterval(timerRef.current);
      socket.off("table-updated", fetchTables);
    };
  }, []);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const handleOpenSession = async (tableId) => {
    setSessionActionLoading(true);
    try {
      const res = await api.post("/sessions/open", { tableId });
      setTables((prev) =>
        prev.map((tb) => (tb._id === tableId ? { ...tb, status: "OCCUPIED", currentSessionId: res.data } : tb))
      );
      setTimers((prev) => ({ ...prev, [tableId]: 0 }));
      setSelectedTable(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to open session");
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleCloseAndBill = async () => {
    if (!selectedPaymentMethod) return;
    const sessionId = selectedTable.currentSessionId?._id;
    if (!sessionId) { alert("No active session found"); return; }
    setSessionActionLoading(true);
    try {
      await api.post("/bills/generate", { sessionId, paymentMethod: selectedPaymentMethod });
      setShowPaymentModal(false);
      setSelectedPaymentMethod(null);
      setSelectedTable(null);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate bill");
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      const now = Date.now();
      await api.put(`/tables/${tableId}`, { status: newStatus });
      setTables((prev) =>
        prev.map((tb) => (tb._id === tableId ? { ...tb, status: newStatus } : tb))
      );
      if (newStatus === "OCCUPIED") {
        setTimers((prev) => ({ ...prev, [tableId]: 0 }));
      } else {
        setTimers((prev) => {
          const next = { ...prev };
          delete next[tableId];
          return next;
        });
      }
      setSelectedTable(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update table");
    }
  };

  const handleAddTable = async () => {
    const num = parseInt(newForm.number);
    if (!num || num < 1) { alert("Enter a valid table number"); return; }
    try {
      const res = await api.post("/tables", { number: num, capacity: newForm.capacity, zone: newForm.zone });
      setTables((prev) => [...prev, res.data].sort((a, b) => a.number - b.number));
      setShowAddForm(false);
      setNewForm({ number: "", capacity: 4, zone: "Main Hall" });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add table");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("tables.deleteConfirm"))) return;
    try {
      await api.delete(`/tables/${id}`);
      setTables((prev) => prev.filter((tb) => tb._id !== id));
      setSelectedTable(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const counts = {};
  Object.keys(statusConfig).forEach((s) => (counts[s] = tables.filter((tb) => tb.status === s).length));

  const filteredTables = tables.filter((table) => {
    if (activeFloor === "tables.allFloors") return true;
    const targetZone = floorZoneMap[activeFloor];
    return (table.zone || "Main Hall") === targetZone;
  });

  const statCards = [
    { label: t("tables.total"), val: tables.length, color: "#ffc174", icon: "table_rows" },
    { label: t("tables.available"), val: counts.AVAILABLE || 0, color: "#56e5a9", icon: "check_circle" },
    { label: t("tables.occupied"), val: counts.OCCUPIED || 0, color: "#ffb690", icon: "groups" },
    { label: t("tables.reserved"), val: counts.RESERVED || 0, color: "#a78bfa", icon: "bookmark" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <p className="text-error text-sm mt-2">{error}</p>
          <button onClick={fetchTables} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">{t("common.retry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">{t("tables.title")}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{t("tables.subtitle")}</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="px-5 py-3 rounded-xl bg-primary/20 text-primary border border-primary/30 font-semibold text-sm hover:bg-primary/30 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>{t("tables.addTable")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <GlassCard key={i} className="rounded-xl p-4 flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ color: s.color }}>{s.icon}</span>
            <h3 className="text-xl md:text-2xl font-bold" style={{ color: s.color }}>{s.val}</h3>
            <p className="text-on-surface-variant/50 text-xs">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Floor filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {floorOptions.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFloor(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeFloor === f ? "text-primary bg-primary/10 border border-primary/30" : "text-on-surface-variant/50 hover:bg-white/5"}`}
          >
            {t(f)}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
        {filteredTables.map((table) => {
          const sc = statusConfig[table.status] || statusConfig.AVAILABLE;
          const randomZone = table.zone || zoneLabels[table.number % zoneLabels.length];
          const elapsed = timers[table._id];
          const sessionAmount = table.currentSessionId?.totalAmount;

          return (
            <GlassCard
              key={table._id}
              className="rounded-xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
              onClick={() => setSelectedTable(table)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white text-lg">Table #{table.number}</p>
                  <p className="text-on-surface-variant/40 text-xs">{randomZone} · {table.capacity || 4} {t("tables.guests")}</p>
                </div>
                <span className="material-symbols-outlined text-xl" style={{ color: sc.color }}>{sc.icon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                  {t(sc.label)}
                </span>
                <div className="flex items-center gap-3">
                  {sessionAmount != null && sessionAmount > 0 && (
                    <span className="font-mono text-xs" style={{ color: "#ffc174" }}>{formatVND(sessionAmount)}</span>
                  )}
                  {elapsed != null && (
                    <span className="font-mono text-xs" style={{ color: sc.color }}>{formatTimer(elapsed)}</span>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* ===== Table Detail Modal ===== */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedTable(null); setShowPaymentModal(false); }}>
          <GlassCard className="rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const table = selectedTable;
              const sc = statusConfig[table.status] || statusConfig.AVAILABLE;
              const hasActiveSession = table.status === "OCCUPIED" && table.currentSessionId?._id;
              const sessionAmount = table.currentSessionId?.totalAmount;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-white font-bold text-xl">Table #{table.number}</h2>
                      <p className="text-on-surface-variant/40 text-xs">{table.zone || "Main Hall"} · {table.capacity || 4} {t("tables.guests")}</p>
                    </div>
                    <span className="material-symbols-outlined text-2xl" style={{ color: sc.color }}>{sc.icon}</span>
                  </div>

                  {/* Session Info */}
                  {hasActiveSession && (
                    <div className="mb-5 p-4 rounded-2xl flex items-center justify-between" style={{ background: "rgba(255,182,144,0.08)", border: "1px solid rgba(255,182,144,0.2)" }}>
                      <div>
                        <p className="text-white text-sm font-semibold">Active Session</p>
                        <p className="text-on-surface-variant/50 text-xs">#{table.currentSessionId._id?.toString().slice(-6)}</p>
                      </div>
                      <span className="font-mono font-bold text-lg" style={{ color: "#ffc174" }}>
                        {formatVND(sessionAmount || 0)}
                      </span>
                    </div>
                  )}

                  {/* Session Actions */}
                  <div className="mb-5 space-y-2">
                    {hasActiveSession ? (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={sessionActionLoading}
                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}
                      >
                        {sessionActionLoading ? (
                          <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-lg">receipt_long</span>
                        )}
                        Close & Generate Bill
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSession(table._id)}
                        disabled={sessionActionLoading || table.status !== "AVAILABLE"}
                        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                        style={{ background: "#56e5a9", color: "#003824", boxShadow: "0 0 20px rgba(86,229,169,0.2)" }}
                      >
                        {sessionActionLoading ? (
                          <div className="w-4 h-4 border-2 border-on-tertiary/30 border-t-on-tertiary rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-lg">play_circle</span>
                        )}
                        Open Session
                      </button>
                    )}
                  </div>

                  {/* Status change */}
                  <div className="mb-4">
                    <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">{t("tables.changeStatus")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => handleStatusChange(table._id, k)}
                          disabled={sessionActionLoading}
                          className={`p-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${table.status === k ? "scale-105 ring-2 ring-white/20" : ""}`}
                          style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color }}
                        >
                          {t(v.label)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(table._id)}
                    disabled={sessionActionLoading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-error hover:bg-error/10 transition-colors border border-error/30 disabled:opacity-40"
                  >
                    {t("tables.deleteTable")}
                  </button>
                </>
              );
            })()}
          </GlassCard>
        </div>
      )}

      {/* ===== Payment Method Modal ===== */}
      {showPaymentModal && selectedTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); }}>
          <GlassCard className="rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Generate Bill</h2>
              <button onClick={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); }} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-on-surface-variant/50 text-xs mb-4">
              Table #{selectedTable.number} · {formatVND(selectedTable.currentSessionId?.totalAmount || 0)}
            </p>

            <div className="space-y-2 mb-5">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedPaymentMethod(pm.id)}
                  className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200"
                  style={{
                    background: selectedPaymentMethod === pm.id ? `${pm.color}15` : "rgba(255,255,255,0.03)",
                    border: selectedPaymentMethod === pm.id ? `1px solid ${pm.color}50` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${pm.color}20` }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: selectedPaymentMethod === pm.id ? pm.color : "rgba(255,255,255,0.5)" }}>{pm.icon}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: selectedPaymentMethod === pm.id ? pm.color : "#dce2f7" }}>{pm.label}</span>
                  {selectedPaymentMethod === pm.id && (
                    <span className="ml-auto material-symbols-outlined text-lg" style={{ color: pm.color, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); }} className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant border border-white/10">
                Cancel
              </button>
              <button
                onClick={handleCloseAndBill}
                disabled={!selectedPaymentMethod || sessionActionLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
                style={{ background: "#ffc174", color: "#472a00" }}
              >
                {sessionActionLoading ? (
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin mx-auto" />
                ) : (
                  "Confirm & Close"
                )}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ===== Add Table Modal ===== */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)}>
          <GlassCard className="rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">{t("tables.registerNewTable")}</h2>
              <button onClick={() => setShowAddForm(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">{t("common.close")}</span>
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("tables.tableNumber")}</label>
                <input type="number" placeholder="e.g. 25" value={newForm.number} onChange={(e) => setNewForm({ ...newForm, number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTable(); }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("tables.capacity")}</label>
                  <select value={newForm.capacity} onChange={(e) => setNewForm({ ...newForm, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors">
                    {guestCounts.map((n) => (<option key={n} value={n} className="bg-[#1a2333]">{n} {t("tables.guests")}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("tables.zone")}</label>
                  <select value={newForm.zone} onChange={(e) => setNewForm({ ...newForm, zone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors">
                    {zoneLabels.map((z) => (<option key={z} value={z} className="bg-[#1a2333]">{z}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant border border-white/10 hover:bg-white/5 transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={handleAddTable} className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20">
                {t("tables.register")}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
