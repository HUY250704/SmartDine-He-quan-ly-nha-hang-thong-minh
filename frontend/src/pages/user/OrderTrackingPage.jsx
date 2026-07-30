import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import api from "@/lib/api.js";
import { getSocket } from "@/lib/socket.js";
import { formatVND, toVND } from "@/lib/price.js";

const STATUS_STEPS = [
  { key: "received", label: "Order Received", icon: "receipt" },
  { key: "confirmed", label: "Confirmed", icon: "check_circle" },
  { key: "preparing", label: "Preparing", icon: "cooking" },
  { key: "ready", label: "Ready to Serve", icon: "room_service" },
  { key: "served", label: "Served", icon: "done_all" },
];

const statusIndexMap = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
  SERVED: 4,
  CANCELLED: -1,
};



const glassCardStyle = {
  backdropFilter: "blur(16px)",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.05)",
};

const glassButtonStyle = {
  backdropFilter: "blur(8px)",
  background: "rgba(255,193,116,0.1)",
  border: "1px solid rgba(255,193,116,0.2)",
  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
};

export default function OrderTrackingPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCards, setVisibleCards] = useState(new Set());

  const fetchOrders = () => {
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) {
      setError("No active session");
      setLoading(false);
      return;
    }
    api
      .get(`/orders/session/${sessionId}`)
      .then((res) => {
        const enriched = res.data.map((order) => {
          const statusIdx = statusIndexMap[order.status] ?? 0;
          const total = order.items?.reduce((s, it) => {
            const price = it.menuItemId?.price || 0;
            return s + price * it.quantity;
          }, 0);
          const subtotal = toVND(total);
          const serviceCharge = Math.round(totalVND * 0.1);
          return {
            ...order,
            statusIndex: statusIdx,
            subtotal: subtotal,
            serviceCharge,
            total: subtotal + serviceCharge,
            itemCount: order.items?.length || 0,
            items: order.items?.map((it) => ({
              name: it.menuItemId?.name || "Item",
              price: (it.menuItemId?.price || 0) * 25000,
              qty: it.quantity,
            })) || [],
            time: new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            displayId: `#SD-${order._id.toString().slice(-6).toUpperCase()}`,
          };
        });
        setOrders(enriched);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) return;

    const socket = getSocket();
    socket.emit("join-session", sessionId);

    const onNewOrder = (data) => {
      fetchOrders();
    };
    const onOrderUpdated = (data) => {
      fetchOrders();
    };

    socket.on("new-order", onNewOrder);
    socket.on("order-updated", onOrderUpdated);

    return () => {
      socket.emit("leave-session", sessionId);
      socket.off("new-order", onNewOrder);
      socket.off("order-updated", onOrderUpdated);
    };
  }, []);

  // Animate cards on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, entry.target.dataset.card]));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-card]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(circle at top right, #1a2333, #0c1322)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-on-surface pb-24 relative" style={{ background: "radial-gradient(circle at top right, #1a2333, #0c1322)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">{t("user.backToMenu")}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{t("user.yourOrders")}</h1>
          <button onClick={fetchOrders} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">refresh</span>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.3)", color: "#ffb4ab" }}>
            <span className="material-symbols-outlined text-sm mr-2 align-text-bottom">error</span>
            {error}
          </div>
        )}

        {orders.length === 0 && !error ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/10 mb-4">receipt_long</span>
            <p className="text-on-surface-variant/40 text-sm mb-6">No orders yet</p>
            <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="px-8 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20">
              {t("user.menu")}
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isActive = order.statusIndex >= 0 && order.statusIndex < 4;
            const isDone = order.statusIndex >= 4;

            return (
              <div key={order._id}
                data-card={order._id}
                className="transition-all duration-700"
                style={{ opacity: visibleCards.has(order._id) ? 1 : 0, transform: visibleCards.has(order._id) ? "translateY(0)" : "translateY(16px)" }}
              >
                {/* Order Status Card */}
                <div className="rounded-2xl p-5 mb-5" style={glassCardStyle}>
                  {/* Table & Live badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>table_restaurant</span>
                        <span className="text-xs font-bold text-white">
                          Table <span style={{ color: "#ffc174" }}>#{tableId}</span>
                        </span>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full animate-status-pulse"
                          style={{ background: "rgba(86,229,169,0.15)", border: "1px solid rgba(86,229,169,0.3)", color: "#56e5a9" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                        </div>
                      )}
                      {isDone && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(255,193,116,0.1)", border: "1px solid rgba(255,193,116,0.2)", color: "#ffc174" }}>
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Served</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-on-surface-variant/40">{order.time}</p>
                      <p className="font-mono text-primary font-bold text-sm">{order.displayId}</p>
                    </div>
                  </div>

                  {/* Status Steps Timeline */}
                  {order.status !== "CANCELLED" && (
                    <div className="flex justify-between items-start mb-6 relative">
                      {/* Progress bar background */}
                      <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-white/10 rounded-full" />
                      {/* Progress bar fill */}
                      <div className="absolute top-4 left-[10%] h-[2px] rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(0, ((order.statusIndex) / (STATUS_STEPS.length - 1)) * 80)}%`,
                          background: "linear-gradient(90deg, #ffc174 0%, #f59e0b 100%)",
                        }}
                      />

                      {STATUS_STEPS.map((step, i) => {
                        const isCompleted = i <= order.statusIndex;
                        const isCurrent = i === order.statusIndex && isActive;
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2 relative z-10" style={{ width: "20%" }}>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                isCurrent ? "animate-status-pulse" : ""
                              }`}
                              style={{
                                background: isCompleted ? "rgba(255,193,116,0.15)" : "rgba(255,255,255,0.04)",
                                border: isCompleted ? "1px solid rgba(255,193,116,0.5)" : "1px solid rgba(255,255,255,0.08)",
                                color: isCompleted ? "#ffc174" : "rgba(255,255,255,0.2)",
                              }}
                            >
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                                {isCompleted ? (i === order.statusIndex + 1 ? step.icon : "check") : step.icon}
                              </span>
                            </div>
                            <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: isCompleted ? "#ffc174" : "rgba(255,255,255,0.2)" }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {order.status === "CANCELLED" && (
                    <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,180,171,0.08)", border: "1px solid rgba(255,180,171,0.2)" }}>
                      <span className="material-symbols-outlined text-error text-xl">cancel</span>
                      <div>
                        <p className="text-error font-semibold text-sm">Order Cancelled</p>
                        <p className="text-error/60 text-xs">This order has been cancelled</p>
                      </div>
                    </div>
                  )}

                  {/* Items & Total */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Your Selections</h4>
                    {order.items.map((it, j) => (
                      <div key={j} className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "#dce2f7" }}>
                            {it.qty}
                          </span>
                          <span className="text-sm text-on-surface">{it.name}</span>
                        </div>
                        <span className="font-mono text-sm text-on-surface-variant">{formatVND(it.price)}</span>
                      </div>
                    ))}

                    {/* Order Summary */}
                    <div className="flex justify-between text-sm mt-3">
                      <span className="text-on-surface-variant">Subtotal</span>
                      <span className="font-medium text-on-surface">{formatVND(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Service (10%)</span>
                      <span className="font-medium text-on-surface">{formatVND(order.serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                      <span>Total</span>
                      <span style={{ color: "#ffc174" }}>{formatVND(order.total)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => navigate(`/customer/${tableId}/menu`)}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add More Items
                    </button>
                    <button
                      onClick={() => navigate(`/customer/${tableId}/support`)}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      style={glassButtonStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,193,116,0.2)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,193,116,0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">help</span>
                      {t("user.callStaff")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* While You Wait Section */}
        {orders.length > 0 && orders.some((o) => o.statusIndex >= 0 && o.statusIndex < 4) && (
          <section className="mt-10">
            <h3 className="text-lg font-bold text-white mb-4">While You Wait...</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.08] transition-all cursor-pointer" style={glassCardStyle}
                onClick={() => navigate(`/customer/${tableId}/menu`)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-secondary" style={{ background: "rgba(255,182,144,0.2)" }}>
                  <span className="material-symbols-outlined text-lg">menu_book</span>
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Dessert Menu</p>
                  <p className="text-[10px] text-on-surface-variant">Pre-order for later</p>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.08] transition-all cursor-pointer" style={glassCardStyle}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-tertiary" style={{ background: "rgba(86,229,169,0.2)" }}>
                  <span className="material-symbols-outlined text-lg">wifi</span>
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Free Guest Wi-Fi</p>
                  <p className="text-[10px] text-on-surface-variant">Connected & Secure</p>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.08] transition-all cursor-pointer" style={glassCardStyle}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary" style={{ background: "rgba(255,193,116,0.2)" }}>
                  <span className="material-symbols-outlined text-lg">star</span>
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Loyalty Program</p>
                  <p className="text-[10px] text-on-surface-variant">Earn {Math.round(order.total / 1000)} points</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <style>{`
        @keyframes pulse-primary { 0% { box-shadow: 0 0 0 0 rgba(255,193,116,0.4); } 70% { box-shadow: 0 0 0 12px rgba(255,193,116,0); } 100% { box-shadow: 0 0 0 0 rgba(255,193,116,0); } }
        .animate-status-pulse { animation: pulse-primary 2s infinite; }
        .glass-card { backdrop-filter: blur(16px); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); box-shadow: inset 1px 1px 0px rgba(255,255,255,0.05); }
      `}</style>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}




