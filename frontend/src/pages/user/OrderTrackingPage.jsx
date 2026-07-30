import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import api from "@/lib/api.js";
import { getSocket } from "@/lib/socket.js";
import { formatPrice, toVND } from "@/lib/price.js";

const STATUS_STEPS = [
  { key: "received", label: "Received", icon: "receipt", color: "#ffc174" },
  { key: "confirmed", label: "Confirmed", icon: "check_circle", color: "#ffc174" },
  { key: "preparing", label: "Preparing", icon: "cooking", color: "#ffb690" },
  { key: "ready", label: "Ready", icon: "room_service", color: "#56e5a9" },
  { key: "served", label: "Served", icon: "done_all", color: "#56e5a9" },
];

const STATUS_MAP = { PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, SERVED: 4, CANCELLED: -1 };
const STATUS_COLOR = { PENDING: "#ffc174", CONFIRMED: "#ffc174", PREPARING: "#ffb690", READY: "#56e5a9", SERVED: "#56e5a9", CANCELLED: "#ffb4ab" };

const glassCard = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export default function OrderTrackingPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = () => {
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) { setError("No active session"); setLoading(false); return; }
    api.get(`/orders/session/${sessionId}`)
      .then((res) => {
        setOrders(res.data.map((order) => {
          const totalUSD = order.items?.reduce((s, it) => s + (it.menuItemId?.price || 0) * it.quantity, 0);
          const subtotal = toVND(totalUSD);
          const serviceCharge = Math.round(subtotal * 0.1);
          return {
            ...order,
            statusIdx: STATUS_MAP[order.status] ?? 0,
            subtotal, serviceCharge,
            total: subtotal + serviceCharge,
            itemCount: order.items?.length || 0,
            items: order.items?.map((it) => ({
              name: it.menuItemId?.name || "Item",
              price: toVND(it.menuItemId?.price || 0),
              qty: it.quantity,
              image: it.menuItemId?.image || "",
            })) || [],
            time: new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            displayId: `SD-${order._id.toString().slice(-6).toUpperCase()}`,
          };
        }));
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const sessionId = localStorage.getItem("smartdine_sessionId");
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit("join-session", sessionId);
    socket.on("new-order", fetchOrders);
    socket.on("order-updated", fetchOrders);
    return () => {
      socket.emit("leave-session", sessionId);
      socket.off("new-order", fetchOrders);
      socket.off("order-updated", fetchOrders);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{t("user.orders") || "My Orders"}</h2>
        <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(255,193,116,0.1)", border: "1px solid rgba(255,193,116,0.2)", color: "#ffc174" }}>
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Add Items
        </button>
      </div>

      {error && (
        <div className="text-center py-20 rounded-2xl" style={glassCard}>
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3">receipt_long</span>
          <p className="text-on-surface-variant/50 text-sm">{error}</p>
        </div>
      )}

      {orders.length === 0 && !error && (
        <div className="text-center py-20 rounded-2xl" style={glassCard}>
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">receipt_long</span>
          <p className="text-on-surface-variant/50 text-sm mb-4">No orders yet</p>
          <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "rgba(255,193,116,0.15)", border: "1px solid rgba(255,193,116,0.3)", color: "#ffc174" }}>
            Start Ordering
          </button>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => {
          const isCancelled = order.status === "CANCELLED";
          const isServed = order.status === "SERVED";

          return (
            <div key={order._id} className="rounded-2xl overflow-hidden" style={{ ...glassCard, opacity: isCancelled ? 0.5 : 1 }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold text-white">{order.displayId}</span>
                  <span className="text-on-surface-variant/30 text-xs">{order.time}</span>
                  {isCancelled && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "rgba(255,180,171,0.15)", color: "#ffb4ab", border: "1px solid rgba(255,180,171,0.3)" }}>CANCELLED</span>}
                  {isServed && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "rgba(86,229,169,0.15)", color: "#56e5a9", border: "1px solid rgba(86,229,169,0.3)" }}>SERVED</span>}
                </div>
                <span className="font-mono font-bold text-sm" style={{ color: "#ffc174" }}>{formatPrice(order.total)}</span>
              </div>

              <div className="flex flex-col md:flex-row">
                {!isCancelled && (
                  <div className="px-6 py-5 md:w-[220px] shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex md:flex-col gap-2 md:gap-0">
                      {STATUS_STEPS.map((step, idx) => {
                        const done = idx <= order.statusIdx;
                        return (
                          <div key={idx} className="flex md:flex-row flex-col items-center md:items-start gap-2 flex-1 md:flex-none md:gap-0">
                            <div className="flex items-center gap-0 md:gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${done ? "bg-tertiary/20 border border-tertiary/40" : "bg-white/5 border border-white/10"}`}>
                                <span className="material-symbols-outlined text-sm" style={{ color: done ? "#56e5a9" : "rgba(255,255,255,0.3)", fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>{step.icon}</span>
                              </div>
                              {idx < 4 && <div className={`hidden md:block w-0.5 h-6 ml-3.5 ${done ? "bg-tertiary/60" : "bg-white/5"}`} />}
                            </div>
                            <div className={`hidden md:block pb-4 ${done ? "text-white" : "text-on-surface-variant/30"}`}>
                              <p className="text-xs font-semibold">{step.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex-1 p-6">
                  <div className="space-y-3">
                    {order.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0">
                          {it.image ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant/20 text-sm">restaurant</span></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{it.name}</p>
                          <p className="text-on-surface-variant/40 text-xs">x{it.qty} · {formatPrice(it.price)}</p>
                        </div>
                        <span className="font-mono text-xs text-on-surface-variant/60">{formatPrice(it.price * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 mt-4 pt-4 flex items-center justify-between">
                    <span className="text-on-surface-variant/60 text-xs">Subtotal + Service (10%)</span>
                    <span className="font-mono font-bold text-sm" style={{ color: "#ffc174" }}>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dce2f7" }}>
                  <span className="material-symbols-outlined text-sm">add_circle</span> Add More
                </button>
                {order.status !== "CANCELLED" && order.status !== "SERVED" && (
                  <button onClick={() => navigate(`/customer/${tableId}/support`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: "rgba(255,193,116,0.1)", border: "1px solid rgba(255,193,116,0.2)", color: "#ffc174" }}>
                    <span className="material-symbols-outlined text-sm">support_agent</span> Call Staff
                  </button>
                )}
                {order.status === "SERVED" && (
                  <button onClick={() => navigate(`/customer/${tableId}/support`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: "#ffc174", color: "#472a00" }}>
                    <span className="material-symbols-outlined text-sm">payments</span> Pay Bill
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {orders.length > 0 && orders.some((o) => o.statusIdx >= 0 && o.statusIdx < 4) && (
        <section className="mt-10">
          <h3 className="text-base font-bold text-white mb-4">While You Wait...</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "menu_book", label: "Dessert Menu", desc: "Pre-order for later", color: "#ffb690", to: "menu" },
              { icon: "wifi", label: "Free Wi-Fi", desc: "Connected & Secure", color: "#56e5a9", to: null },
              { icon: "star", label: "Loyalty Points", desc: `Earn ${Math.round((orders[0]?.total || 0) / 1000)} pts`, color: "#ffc174", to: null },
            ].map((card, i) => (
              <div key={i} className="p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/[0.06] transition-all" style={glassCard}
                onClick={() => card.to && navigate(`/customer/${tableId}/${card.to}`)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${card.color}20` }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: card.color }}>{card.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">{card.label}</p>
                  <p className="text-[10px] text-on-surface-variant/40">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
