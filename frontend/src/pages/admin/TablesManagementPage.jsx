import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";

const statusConfig = {
  AVAILABLE: { label: "Available", color: "#56e5a9", bg: "rgba(86,229,169,0.1)", border: "rgba(86,229,169,0.2)", icon: "check_circle" },
  OCCUPIED:  { label: "Occupied",  color: "#ffc174", bg: "rgba(255,193,116,0.1)", border: "rgba(255,193,116,0.2)", icon: "groups" },
  RESERVED:  { label: "Reserved",  color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.2)",  icon: "bookmark" },
  CLEANING:  { label: "Cleaning",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)",  icon: "mop" },
};

export default function TablesManagementPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");

  const fetchTables = () => {
    api.get("/tables")
      .then((res) => setTables(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load tables"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTables(); }, []);

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await api.put(`/tables/${tableId}`, { status: newStatus });
      setTables((prev) => prev.map((t) => (t._id === tableId ? { ...t, status: newStatus } : t)));
      setSelectedTable(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update table");
    }
  };

  const handleAddTable = async () => {
    const num = parseInt(newTableNumber);
    if (!num || num < 1) { alert("Enter a valid table number"); return; }
    try {
      const res = await api.post("/tables", { number: num });
      setTables((prev) => [...prev, res.data].sort((a, b) => a.number - b.number));
      setShowAddForm(false);
      setNewTableNumber("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add table");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this table?")) return;
    try {
      await api.delete(`/tables/${id}`);
      setTables((prev) => prev.filter((t) => t._id !== id));
      setSelectedTable(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const counts = {};
  Object.keys(statusConfig).forEach((s) => (counts[s] = tables.filter((t) => t.status === s).length));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">Loading tables...</p>
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
          <button onClick={fetchTables} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">Table Management</h1>
          <p className="text-on-surface-variant/60 text-sm mt-1">Real-time floor plan overview</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
          style={{ background: "#ffc174", color: "#472a00" }}
        >
          <span className="material-symbols-outlined text-lg align-middle mr-1">add</span>Add Table
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", val: tables.length, color: "#dce2f7" },
          { label: "Available", val: counts.AVAILABLE, color: "#56e5a9" },
          { label: "Occupied", val: counts.OCCUPIED, color: "#ffc174" },
          { label: "Reserved", val: counts.RESERVED, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-on-surface-variant/40 text-[11px] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(statusConfig).map(([key, sc]) => (
          <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sc.color }} />
            <span className="text-on-surface-variant">{sc.label}</span>
            <span className="font-mono text-white">{counts[key]}</span>
          </div>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((t) => {
          const sc = statusConfig[t.status] || statusConfig.AVAILABLE;
          return (
            <div
              key={t._id}
              onClick={() => setSelectedTable(t)}
              className="rounded-2xl p-5 transition-all cursor-pointer hover:-translate-y-1"
              style={{
                backdropFilter: "blur(16px)",
                background: sc.bg,
                border: `1px solid ${sc.border}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold" style={{ color: sc.color }}>Table #{t.number}</span>
                <span className="material-symbols-outlined text-2xl" style={{ color: sc.color }}>{sc.icon}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                  style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                  {sc.label}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                {t.status === "OCCUPIED" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(t._id, "AVAILABLE"); }}
                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: "#56e5a9", color: "#003824" }}
                  >
                    Close & Bill
                  </button>
                )}
                {t.status === "AVAILABLE" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(t._id, "OCCUPIED"); }}
                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: "#ffc174", color: "#472a00" }}
                  >
                    Open Session
                  </button>
                )}
                {t.status === "RESERVED" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(t._id, "OCCUPIED"); }}
                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: "#ffc174", color: "#472a00" }}
                  >
                    Check In
                  </button>
                )}
                {t.status === "CLEANING" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(t._id, "AVAILABLE"); }}
                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: "#56e5a9", color: "#003824" }}
                  >
                    Mark Clean
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTable(null)}>
          <div
            className="rounded-3xl p-6 w-full max-w-sm"
            style={{ backdropFilter: "blur(32px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const sc = statusConfig[selectedTable.status] || statusConfig.AVAILABLE;
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-bold" style={{ color: sc.color }}>Table #{selectedTable.number}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                        {sc.label}
                      </span>
                    </div>
                    <button onClick={() => setSelectedTable(null)} className="text-on-surface-variant hover:text-white">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">Change Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => handleStatusChange(selectedTable._id, k)}
                          className={`p-2 rounded-lg text-xs font-semibold transition-all ${selectedTable.status === k ? "scale-105 ring-2 ring-white/20" : ""}`}
                          style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedTable._id)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-error hover:bg-error/10 transition-colors"
                    style={{ border: "1px solid rgba(255,180,171,0.3)" }}
                  >
                    Delete Table
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)}>
          <div
            className="rounded-3xl p-6 w-full max-w-sm"
            style={{ backdropFilter: "blur(32px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">Add New Table</h2>
              <button onClick={() => setShowAddForm(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">Table Number</label>
              <input
                type="number"
                placeholder="e.g. 14"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddTable(); }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-white/5 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
              <button onClick={handleAddTable} className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all"
                style={{ background: "#ffc174", color: "#472a00" }}>Add Table</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
