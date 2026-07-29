import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";

const STATUS_STEPS = [
  { key: "received", label: "Order Received", icon: "receipt" },
  { key: "confirmed", label: "Confirmed", icon: "check_circle" },
  { key: "preparing", label: "Preparing", icon: "cooking" },
  { key: "ready", label: "Ready to Serve", icon: "room_service" },
  { key: "served", label: "Served", icon: "done_all" },
];

const mockOrders = [
  {
    id: "#SD-4091", status: "preparing", statusIndex: 2, eta: "12 min",
    items: [
      { name: "Wagyu Beef Tartare", qty: 2, price: "$58.00" },
      { name: "Ribeye Steak 300g", qty: 1, price: "$95.00" },
      { name: "Chocolate Lava Cake", qty: 1, price: "$12.00" },
    ],
    total: "$223.00", time: "19:45",
  },
  {
    id: "#SD-4090", status: "confirmed", statusIndex: 1, eta: "18 min",
    items: [{ name: "Sparkling Yuzu", qty: 2, price: "$14.00" }],
    total: "$28.00", time: "19:52",
  },
];

export default function OrderTrackingPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [expandedOrder, setExpandedOrder] = useState(mockOrders[0]?.id);

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span><span className="text-sm font-medium">{t("user.backToMenu")}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{t("user.yourOrders")}</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {mockOrders.map(order => {
          const isExpanded = expandedOrder === order.id;
          const currentStep = STATUS_STEPS[order.statusIndex];
          const progressPct = ((order.statusIndex + 1) / STATUS_STEPS.length) * 100;

          return (
            <div key={order.id} className="rounded-2xl overflow-hidden"
              style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="p-5 cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-mono text-primary font-bold">{order.id}</span><span className="text-on-surface-variant/40 text-xs">{order.time}</span></div>
                    <p className="text-on-surface-variant text-xs mt-1">{order.items.length} items • ETA {order.eta}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-white">{order.total}</span>
                    <span className="material-symbols-outlined text-on-surface-variant/40 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "" }}>expand_more</span>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-tertiary transition-all duration-700" style={{ width: progressPct + "%" }} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" style={{ color: "#ffc174" }}>{currentStep.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: "#ffc174" }}>{currentStep.label}</span>
                  {order.eta && <span className="text-on-surface-variant/40 text-xs ml-auto">{order.eta}</span>}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-white/5">
                  <div className="flex justify-between text-xs my-4">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step.key} className="flex flex-col items-center gap-1 text-center w-16">
                        <div className={`w-2 h-2 rounded-full mb-0.5 ${i <= order.statusIndex ? "bg-primary" : "bg-white/10"}`} />
                        <span className="material-symbols-outlined text-sm" style={{ color: i <= order.statusIndex ? "#ffc174" : "rgba(255,255,255,0.15)" }}>{step.icon}</span>
                        <span className="text-[9px]" style={{ color: i <= order.statusIndex ? "#ffc174" : "rgba(255,255,255,0.3)" }}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    {order.items.map((it, j) => (
                      <div key={j} className="flex justify-between text-sm"><span className="text-on-surface">{it.qty}x {it.name}</span><span className="font-mono text-on-surface-variant">{it.price}</span></div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-white/5 font-bold"><span>{t("user.total")}</span><span className="font-mono text-primary">{order.total}</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
