import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";

const STATUS_TABS = ["All", "PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"];

const statusConfig = {
  PENDING:    { label: "Pending",    color: "#ffc174", bg: "rgba(255,193,116,0.1)", border: "rgba(255,193,116,0.2)", icon: "hourglass_empty" },
  CONFIRMED:  { label: "Confirmed",  color: "#56e5a9", bg: "rgba(86,229,169,0.1)",  border: "rgba(86,229,169,0.2)",  icon: "check_circle" },
  PREPARING:  { label: "Preparing",  color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)",  icon: "cooking" },
  READY:      { label: "Ready",      color: "#ffb690", bg: "rgba(255,182,144,0.1)",  border: "rgba(255,182,144,0.2)", icon: "room_service" },
  SERVED:     { label: "Served",     color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.2)", icon: "done_all" },
  CANCELLED:  { label: "Cancelled",  color: "#ffb4ab", bg: "rgba(255,180,171,0.1)",  border: "rgba(255,180,171,0.2)", icon: "cancel" },
};

const nextActions = {
  PENDING:   [{ label: "Confirm", newStatus: "CONFIRMED", color: "#56e5a9" }, { label: "Cancel", newStatus: "CANCELLED", color: "#ffb4ab" }],
  CONFIRMED: [{ label: "Start Preparing", newStatus: "PREPARING", color: "#60a5fa" }, { label: "Cancel", newStatus: "CANCELLED", color: "#ffb4ab" }],
  PREPARING: [{ label: "Mark Ready", newStatus: "READY", color: "#ffb690" }],
  READY:     [{ label: "Mark Served", newStatus: "SERVED", color: "#a78bfa" }],
  SERVED:    [],
  CANCELLED: [],
};

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = () => {
    api.get("/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order");
    }
  };

  const filtered = orders.filter((o) => {
    return activeTab === "All" || o.status === activeTab;
  });

  const counts = {};
  STATUS_TABS.filter((t) => t !== "All").forEach((t) => (counts[t] = orders.filter((o) => o.status === t).length));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">Loading orders...</p>
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
          <button onClick={fetchOrders} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">Orders Management</h1>
          <p className="text-on-surface-variant/60 text-sm mt-1">Real-time kitchen display system</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-sm font-semibold">{counts["PENDING"] || 0} Pending</span>
          </div>
          <button onClick={fetchOrders} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant/80">refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab ? "text-primary" : "text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-white/5"}`}
            style={activeTab === tab ? { background: "rgba(255,193,116,0.1)", border: "1px solid rgba(255,193,116,0.3)" } : { border: "1px solid transparent" }}
          >
            {tab} {tab !== "All" && <span className="ml-1.5 text-xs opacity-60">{counts[tab] || 0}</span>}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">receipt_long</span>
          <p className="text-on-surface-variant/40 text-sm">No orders match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((order) => {
            const sc = statusConfig[order.status] || statusConfig["PENDING"];
            const actions = nextActions[order.status] || [];

            // Calculate total from items
            const total = order.items
              ? order.items.reduce((s, it) => s + (it.menuItemId?.price || 0) * it.quantity, 0)
              : 0;

            return (
              <div
                key={order._id}
                className="rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{
                  backdropFilter: "blur(16px)",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${sc.border}`,
                  boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.05)",
                }}
              >
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg font-mono text-xs">#{order._id.toString().slice(-6)}</span>
                    </div>
                    <div className="flex items-center text-on-surface-variant/40 text-xs mt-1">
                      <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                      <span className="font-mono">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "-"}</span>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                    style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                  >
                    {sc.label}
                  </span>
                </div>

                {/* Items */}
                <div className="p-5 flex-1 space-y-3">
                  {order.items?.map((item, j) => (
                    <div key={j} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-on-surface text-sm font-semibold">{item.quantity}x {item.menuItemId?.name || "Unknown"}</p>
                        {item.note && <p className="text-on-surface-variant/40 text-xs italic mt-0.5">"{item.note}"</p>}
                      </div>
                      <span className="text-on-surface-variant font-mono text-xs ml-2">${((item.menuItemId?.price || 0) * item.quantity).toFixed(0)}</span>
                    </div>
                  )) || <p className="text-on-surface-variant/40 text-xs italic">No items</p>}
                </div>

                {/* Footer */}
                <div className="p-5 mt-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-on-surface-variant/50 text-xs font-bold uppercase tracking-wider">Total</span>
                    <span className="text-white font-mono font-bold text-lg">${total.toFixed(0)}</span>
                  </div>
                  {actions.length > 0 && (
                    <div className="flex gap-2">
                      {actions.map((action, k) => (
                        <button
                          key={k}
                          onClick={() => updateStatus(order._id, action.newStatus)}
                          className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
                          style={{
                            background: action.color,
                            color: action.color === "#ffb4ab" ? "#690005" : action.color === "#56e5a9" ? "#003824" : action.color === "#60a5fa" ? "#0c1322" : action.color === "#ffb690" ? "#552100" : "#472a00",
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
