import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api.js";
import { GlassCard } from "@/components/ui/glass-card.jsx";
import { useLang } from "@/context/LanguageContext.jsx";

const statusConfig = {
  AVAILABLE: { label: "tables.available", color: "#56e5a9", bg: "rgba(86,229,169,0.1)", border: "rgba(86,229,169,0.2)", icon: "check_circle" },
  OCCUPIED:  { label: "tables.occupied",  color: "#ffb690", bg: "rgba(255,182,144,0.1)", border: "rgba(255,182,144,0.2)", icon: "groups" },
  RESERVED:  { label: "tables.reserved",  color: "#ffc174", bg: "rgba(255,193,116,0.1)", border: "rgba(255,193,116,0.2)", icon: "bookmark" },
  CLEANING:  { label: "tables.cleaning",  color: "#a08e7a", bg: "rgba(160,142,122,0.1)",  border: "rgba(160,142,122,0.2)",  icon: "mop" },
};

const zoneLabels = ["Main Hall", "VIP Lounge", "Window Seat", "Patio", "Corner", "Center"];
const guestCounts = [2, 4, 6, 8, 10, 12];

const floorOptions = ["tables.allFloors", "tables.mainHall", "tables.vipTerrace"];
const floorZoneMap = {
  "tables.mainHall": "Main Hall",
  "tables.vipTerrace": "VIP Terrace",
};

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

  const fetchTables = () => {
    api.get("/tables")
      .then((res) => {
        setTables(res.data);
        const now = Date.now();
        const newTimers = {};
        res.data.forEach((t) => {
          if (t.status === "OCCUPIED" && t.occupiedAt) {
            newTimers[t._id] = Math.floor((now - new Date(t.occupiedAt).getTime()) / 1000);
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
        for (const [k, v] of Object.entries(prev)) {
          next[k] = v + 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      const now = Date.now();
      await api.put(`/tables/${tableId}`, { status: newStatus, occupiedAt: newStatus === "OCCUPIED" ? new Date(now).toISOString() : undefined });
      setTables((prev) => prev.map((tb) => (tb._id === tableId ? { ...tb, status: newStatus, occupiedAt: newStatus === "OCCUPIED" ? new Date(now).toISOString() : tb.occupiedAt } : tb)));
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
    if (!targetZone) return true;
    return (table.zone || "Main Hall") === targetZone;
  });

  const statCards = [
    { label: t("tables.total"), val: tables.length, color: "#a08e7a", icon: "table_restaurant" },
    { label: t("tables.available"), val: counts.AVAILABLE || 0, color: "#56e5a9", icon: "check_circle" },
    { label: t("tables.occupied"), val: counts.OCCUPIED || 0, color: "#ffb690", icon: "groups" },
    { label: t("tables.reserved"), val: counts.RESERVED || 0, color: "#ffc174", icon: "bookmark" },
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
        <div><h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">{t("tables.title")}</h1><p className="text-on-surface-variant text-sm mt-1">{t("tables.subtitle")}</p></div>
        <button onClick={() => setShowAddForm(true)} className="px-5 py-3 rounded-xl bg-primary/20 text-primary border border-primary/30 font-semibold text-sm hover:bg-primary/30 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>{t("tables.addTable")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <GlassCard key={i} className="rounded-xl p-4 flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-2xl" style={{ color: s.color }}>{s.icon}</span>
            <h3 className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</h3>
            <p className="text-on-surface-variant/50 text-xs">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Floor filter */}
      <div className="flex items-center gap-2 mb-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => {
          const sc = statusConfig[table.status] || statusConfig.AVAILABLE;
          const randomZone = table.zone || zoneLabels[table.number % zoneLabels.length];
          const elapsed = timers[table._id];
          return (
            <GlassCard key={table._id} className="rounded-xl p-5 cursor-pointer transition-all hover:shadow-xl" onClick={() => setSelectedTable(table)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white text-lg">Table #{table.number}</p>
                  <p className="text-on-surface-variant/40 text-xs">{randomZone} • {table.capacity || 4} {t("tables.guests")}</p>
                </div>
                <span className={`material-symbols-outlined text-xl`} style={{ color: sc.color }}>{sc.icon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border`} style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                  {t(sc.label)}
                </span>
                {elapsed != null && (
                  <span className="font-mono text-xs" style={{ color: sc.color }}>{formatTimer(elapsed)}</span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Selected Table Panel */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTable(null)}>
          <GlassCard className="rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const table = selectedTable;
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-white font-bold text-xl">Table #{table.number}</h2>
                      <p className="text-on-surface-variant/40 text-xs">{table.zone || "Main Hall"} • {table.capacity || 4} {t("tables.guests")}</p>
                    </div>
                    <button onClick={() => setSelectedTable(null)} className="text-on-surface-variant hover:text-white">
                      <span className="material-symbols-outlined">{t("common.close")}</span>
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">{t("tables.changeStatus")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => handleStatusChange(selectedTable._id, k)}
                          className={`p-2 rounded-lg text-xs font-semibold transition-all ${selectedTable.status === k ? "scale-105 ring-2 ring-white/20" : ""}`}
                          style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color }}
                        >
                          {t(v.label)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedTable._id)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-error hover:bg-error/10 transition-colors border border-error/30"
                  >
                    {t("tables.deleteTable")}
                  </button>
                </>
              );
            })()}
          </GlassCard>
        </div>
      )}

      {/* Add Table Modal */}
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
