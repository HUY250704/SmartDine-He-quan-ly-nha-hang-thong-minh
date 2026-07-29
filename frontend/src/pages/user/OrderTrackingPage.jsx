import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import api from "@/lib/api.js";

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

const formatPrice = (p) => (p || 0).toLocaleString("vi-VN") + "\u0111";

export default function OrderTrackingPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

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
          const totalVND = total * 25000;
          return {
            ...order,
            statusIndex: statusIdx,
            total: totalVND,
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
        if (enriched.length > 0) setExpandedOrder(enriched[0]._id);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">{t("user.backToMenu")}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{t("user.yourOrders")}</h1>
          <button onClick={fetchOrders} className="w-8 h-8 flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">refresh</span>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.3)", color: "#ffb4ab" }}>
            {error}
          </div>
        )}

        {orders.length === 0 && !error ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/10 mb-4">receipt_long</span>
            <p className="text-on-surface-variant text-sm">No orders yet</p>
            <button onClick={() => navigate(`/customer/${tableId}/menu`)} className="mt-6 px-6 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all">{t("user.menu")}</button>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrder === order._id;
            const currentStep = STATUS_STEPS[order.statusIndex];
            const progressPct = order.status === "CANCELLED" ? 0 : ((order.statusIndex + 1) / STATUS_STEPS.length) * 100;

            return (
              <div key={order._id} className="rounded-2xl overflow-hidden" style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="p-5 cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order._id)}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary font-bold">{order.displayId}</span>
                        <span className="text-on-surface-variant/40 text-xs">{order.time}</span>
                        {order.status === "CANCELLED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/20 text-error border border-error/30">CANCELLED</span>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-xs mt-1">{order.itemCount} items</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-white">{formatPrice(order.total)}</span>
                      <span className="material-symbols-outlined text-on-surface-variant/40 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "" }}>expand_more</span>
                    </div>
                  </div>

                  {order.status !== "CANCELLED" && (
                    <>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-tertiary transition-all duration-700" style={{ width: progressPct + "%" }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm" style={{ color: "#ffc174" }}>{currentStep.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: "#ffc174" }}>{currentStep.label}</span>
                      </div>
                    </>
                  )}
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-white/5">
                    {order.status !== "CANCELLED" && (
                      <div className="flex justify-between text-xs my-4">
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step.key} className="flex flex-col items-center gap-1 text-center w-16">
                            <div className={`w-2 h-2 rounded-full mb-0.5 ${i <= order.statusIndex ? "bg-primary" : "bg-white/10"}`} />
                            <span className="material-symbols-outlined text-sm" style={{ color: i <= order.statusIndex ? "#ffc174" : "rgba(255,255,255,0.15)" }}>{step.icon}</span>
                            <span className="text-[9px]" style={{ color: i <= order.statusIndex ? "#ffc174" : "rgba(255,255,255,0.3)" }}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      {order.items.map((it, j) => (
                        <div key={j} className="flex justify-between text-sm">
                          <span className="text-on-surface">{it.qty}x {it.name}</span>
                          <span className="font-mono text-on-surface-variant">{formatPrice(it.price)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-white/5 font-bold">
                        <span>{t("user.total")}</span>
                        <span className="font-mono text-primary">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
