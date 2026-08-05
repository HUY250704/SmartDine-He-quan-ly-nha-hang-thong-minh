import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";
import { getSocket } from "@/lib/socket.js";
import { GlassCard } from "@/components/ui/glass-card.jsx";
import { useLang } from "@/context/LanguageContext.jsx";

const STATUS_TABS = [
  { key: "PENDING", label: "orders.pending" },
  { key: "CONFIRMED", label: "orders.confirmed" },
  { key: "PREPARING", label: "orders.preparing" },
  { key: "READY", label: "orders.ready" },
  { key: "SERVED", label: "orders.served" },
  { key: "CANCELLED", label: "orders.cancelled" },
];

const statusConfig = {
  PENDING:   { label: "orders.pending",   color: "#ffc174", bg: "rgba(255,193,116,0.1)", border: "rgba(255,193,116,0.2)", icon: "hourglass_empty", timeUrgent: true },
  CONFIRMED: { label: "orders.confirmed", color: "#56e5a9", bg: "rgba(86,229,169,0.1)",  border: "rgba(86,229,169,0.2)",  icon: "check_circle" },
  PREPARING: { label: "orders.preparing", color: "#56e5a9", bg: "rgba(86,229,169,0.1)",  border: "rgba(86,229,169,0.2)",  icon: "cooking" },
  READY:     { label: "orders.ready",     color: "#ffb690", bg: "rgba(255,182,144,0.1)",  border: "rgba(255,182,144,0.2)",  icon: "room_service" },
  SERVED:    { label: "orders.served",    color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.2)",  icon: "done_all" },
  CANCELLED: { label: "orders.cancelled", color: "#ffb4ab", bg: "rgba(255,180,171,0.1)",  border: "rgba(255,180,171,0.2)",  icon: "cancel" },
};

const nextActions = {
  PENDING:   [
    { label: "orders.cancelOrder", newStatus: "CANCELLED", style: "glass" },
    { label: "orders.confirmOrder", newStatus: "CONFIRMED", style: "primary" },
  ],
  CONFIRMED: [
    { label: "orders.cancelOrder", newStatus: "CANCELLED", style: "glass" },
    { label: "orders.startPreparing", newStatus: "PREPARING", style: "tertiary" },
  ],
  PREPARING: [{ label: "orders.markReady", newStatus: "READY", style: "tertiary" }],
  READY:     [{ label: "orders.markServed", newStatus: "SERVED", style: "secondary" }],
  SERVED:    [],
  CANCELLED: [],
};

function getElapsedMinutes(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

export default function OrdersManagementPage() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTable, setSearchTable] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const fetchOrders = () => {
    api.get("/orders")
      .then((res) => {
        setOrders(res.data);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const socket = getSocket();
    socket.emit("join-admin");

    const handleNewOrder = (orderData) => {
      setOrders((prev) => {
        const order = orderData.order || orderData;
        const orderId = order._id || orderData._id;
        const exists = prev.some((o) => o._id === orderId);
        if (exists) return prev;
        const items = orderData.items || order.items || [];
        const enriched = {
          ...(typeof order === "object" ? order : orderData),
          items,
          tableNumber: orderData.tableId || order.tableNumber,
        };
        setNewOrderAlert({ count: 1 });
        return [enriched, ...prev];
      });
    };

    const handleOrderUpdated = (orderData) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderData._id ? { ...o, ...orderData, items: orderData.items || o.items } : o))
      );
    };

    socket.on("new-order", handleNewOrder);
    socket.on("order-updated", handleOrderUpdated);

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("order-updated", handleOrderUpdated);
    };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order");
    }
  };

  const tabsWithCounts = STATUS_TABS.map((t) => ({
    ...t,
    count: orders.filter((o) => o.status === t.key).length,
  }));

  const filtered = orders.filter((o) => {
    if (o.status !== activeTab) return false;
    if (searchTable && o.tableNumber && !String(o.tableNumber).toLowerCase().includes(searchTable.toLowerCase())) return false;
    return true;
  });

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
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <p className="text-error text-sm">{error}</p>
          <button onClick={fetchOrders} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  const activeSc = statusConfig[activeTab] || statusConfig.PENDING;

  return (
    <div>
      {/* New Order Persistent Alert */}
      {newOrderAlert && (
        <div className="mb-6">
          <GlassCard className="border-tertiary/30 bg-tertiary/5 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary flex-shrink-0">
                <span className="material-symbols-outlined">priority_high</span>
              </div>
              <div>
                <p className="font-bold text-white">{t("orders.newOrderAlert")}</p>
                <p className="text-on-surface-variant text-xs">{newOrderAlert.count} {t("orders.newOrdersArrived")}</p>
              </div>
            </div>
            <button
              onClick={() => { setActiveTab("PENDING"); setNewOrderAlert(null); }}
              className="px-4 py-2 bg-tertiary text-on-tertiary rounded-lg font-bold text-xs transition-transform active:scale-95"
            >
              {t("orders.viewOrder")}
            </button>
          </GlassCard>
        </div>
      )}

      {/* Filter Bar & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {tabsWithCounts.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap text-sm transition-colors ${
                activeTab === tab.key
                  ? "text-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t(tab.label)} ({tab.count})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card rounded-lg flex items-center px-3 py-2">
            <span className="material-symbols-outlined text-on-surface-variant mr-2 text-sm">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-on-surface text-xs w-24 outline-none placeholder:text-on-surface-variant/50"
              placeholder={t("orders.searchTable")}
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
            />
          </div>
          <button onClick={fetchOrders} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">{t("common.refresh").toLowerCase() === "refresh" ? "refresh" : "refresh"}</span>
          </button>
        </div>
      </div>

      {/* Order Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 px-6 text-center">
          <div className="w-48 h-48 mb-6 flex items-center justify-center">
            <span className="material-symbols-outlined text-8xl text-on-surface-variant/10">receipt_long</span>
          </div>
          <h3 className="text-2xl font-semibold text-white">{t("orders.noOrders")}</h3>
          <p className="text-on-surface-variant mt-1 max-w-xs">{t("orders.noOrdersDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((order) => {
            const orderSc = statusConfig[order.status] || statusConfig["PENDING"];
            const actions = nextActions[order.status] || [];
            const elapsed = getElapsedMinutes(order.createdAt);

            const total = order.items
              ? order.items.reduce((s, it) => s + ((it.menuItemId?.price || it.menuItem?.price || 0) * it.quantity), 0)
              : 0;

            const orderIdShort = order._id ? "#ORD-" + order._id.toString().slice(-4).toUpperCase() : "-";

            return (
              <GlassCard
                key={order._id}
                className="rounded-2xl flex flex-col group transition-all"
                style={{ borderColor: orderSc.border }}
              >
                <div className="p-5 border-b border-white/10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-2xl" style={{ color: orderSc.color }}>
                        {order.tableNumber ? `T-${String(order.tableNumber).padStart(2, "0")}` : "T-??"}
                      </span>
                      <span className="text-on-surface-variant text-xs">{orderIdShort}</span>
                    </div>
                    <div className={`flex items-center text-xs mt-1 ${orderSc.timeUrgent ? "text-error" : "text-on-surface-variant"}`}>
                      <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                      <span className="font-mono text-xs">{elapsed != null ? `${elapsed}m ${t("orders.elapsed")}` : t("orders.justNow")}</span>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{ background: orderSc.bg, color: orderSc.color, borderColor: orderSc.border }}
                  >
                    {t(orderSc.label)}
                  </span>
                </div>

                <div className="p-5 flex-1 space-y-3">
                  {order.items?.map((item, j) => {
                    const isServed = item.status === "SERVED";
                    return (
                      <div key={j} className={`flex justify-between items-start ${isServed ? "opacity-50" : ""}`}>
                        <div className="flex-1">
                          <p className={`text-on-surface font-bold text-sm ${isServed ? "line-through" : ""}`}>
                            {item.quantity}x {item.menuItemId?.name || item.name || t("menu.uncategorized")}
                          </p>
                          {item.note && (
                            <p className="text-on-surface-variant text-xs italic mt-0.5">"{item.note}"</p>
                          )}
                        </div>
                        <span className="text-on-surface font-mono text-xs ml-2">
                          ${((item.menuItemId?.price || item.price || 0) * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    );
                  }) || <p className="text-on-surface-variant/40 text-xs italic">No items</p>}
                </div>

                <div className="p-5 mt-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">{t("orders.totalAmount")}</span>
                    <span className="font-bold text-2xl" style={{ color: orderSc.color }}>${total.toFixed(0)}</span>
                  </div>
                  {actions.length > 0 && (
                    actions.length === 1 ? (
                      <button
                        onClick={() => updateStatus(order._id, actions[0].newStatus)}
                        className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
                        style={{
                          background: orderSc.color,
                          color: orderSc.color === "#ffb4ab" ? "#690005" : orderSc.color === "#56e5a9" ? "#003824" : orderSc.color === "#ffb690" ? "#552100" : "#472a00",
                          boxShadow: `0 0 15px ${orderSc.color}4d`,
                        }}
                      >
                        {t(actions[0].label)}
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {actions.map((action, k) => (
                          <button
                            key={k}
                            onClick={() => updateStatus(order._id, action.newStatus)}
                            className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                              action.style === "glass"
                                ? "border border-white/10 hover:bg-white/5 text-on-surface"
                                : ""
                            }`}
                            style={
                              action.style !== "glass"
                                ? {
                                    background: orderSc.color,
                                    color: orderSc.color === "#ffb4ab" ? "#690005" : orderSc.color === "#56e5a9" ? "#003824" : orderSc.color === "#ffb690" ? "#552100" : "#472a00",
                                    boxShadow: `0 0 15px ${orderSc.color}4d`,
                                  }
                                : undefined
                            }
                          >
                            {t(action.label)}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

